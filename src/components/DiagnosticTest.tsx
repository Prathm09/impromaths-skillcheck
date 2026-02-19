"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle,
    ChevronRight,
    Award,
    RefreshCcw,
    Download,
    Mail,
    Loader2,
    Clock,
    Target,
    TrendingUp,
    AlertCircle
} from "lucide-react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { APP_CONFIG } from "../config";

interface Question {
    id: number;
    topic: string;
    question: string;
    options: string[];
    answer: string;
}

interface AnalysisItem {
    question: string;
    topic: string;
    selected: string | undefined;
    correct: string;
    isCorrect: boolean;
}

interface Results {
    score: number;
    total: number;
    category: string;
    message: string;
    badgeColor: string;
    badgeText: string;
    analysis: AnalysisItem[];
    topicStats: Record<string, { total: number; correct: number }>;
    strengths: string[];
    weaknesses: string[];
    timeTaken: string;
}

export default function DiagnosticTest() {
    const [step, setStep] = useState(1); // 1: Info, 2: Test, 3: Results
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", grade: "7" });
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Results | null>(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [timer, setTimer] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Start timer when test begins
    useEffect(() => {
        if (step === 2) {
            timerRef.current = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [step]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const startTest = async () => {
        if (!formData.name || !formData.email || !formData.grade) {
            alert("Please fill in all details.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert("Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get(`${APP_CONFIG.API_BASE_URL}/api/questions/${formData.grade}`);
            setQuestions(res.data);
            setTimer(0);
            setStep(2);
        } catch {
            alert(`Failed to load questions. Make sure the server is running on ${APP_CONFIG.API_BASE_URL}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (option: string) => {
        setAnswers({ ...answers, [currentQuestionIndex]: option });
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const calculateResults = () => {
        setLoading(true); // Loading animation before results

        setTimeout(() => {
            let score = 0;
            const topicStats: Record<string, { total: number; correct: number }> = {};

            const analysis = questions.map((q, idx) => {
                const isCorrect = answers[idx] === q.answer;
                if (isCorrect) score++;

                if (!topicStats[q.topic]) topicStats[q.topic] = { total: 0, correct: 0 };
                topicStats[q.topic].total++;
                if (isCorrect) topicStats[q.topic].correct++;

                return {
                    question: q.question,
                    topic: q.topic,
                    selected: answers[idx],
                    correct: q.answer,
                    isCorrect,
                };
            });

            const strengths = Object.entries(topicStats)
                .filter(([, stats]) => stats.correct / stats.total >= 0.8)
                .map(([topic]) => topic);

            const weaknesses = Object.entries(topicStats)
                .filter(([, stats]) => stats.correct / stats.total < 0.6)
                .map(([topic]) => topic);

            const category = score >= 8 ? "Expert" : score >= 5 ? "Average" : "Not Yet There";
            const badgeColor = score >= 8 ? "bg-green-500" : score >= 5 ? "bg-orange-500" : "bg-red-500";
            const badgeText = score >= 8 ? "Green" : score >= 5 ? "Orange" : "Red";

            const message = category === "Expert"
                ? `Fantastic work! Keep up the great momentum with ImproMaths and take your skills even further. We're here to support your success—reach out to us at ${APP_CONFIG.TEACHER_PHONE}!`
                : category === "Average"
                    ? `Well done! Unlock your full potential with ImproMaths. Reach out to us at ${APP_CONFIG.TEACHER_PHONE} – we're here to help you succeed!`
                    : `Don't worry! Every great journey starts with a first step. At ImproMaths, we’ll help you strengthen your skills and build confidence. Reach out to us at ${APP_CONFIG.TEACHER_PHONE} – your path to improvement begins today!`;

            const newResults = {
                score,
                total: questions.length,
                category,
                message,
                badgeColor,
                badgeText,
                analysis,
                topicStats,
                strengths,
                weaknesses,
                timeTaken: formatTime(timer)
            };

            setResults(newResults);
            setStep(3);
            setLoading(false);

            // AUTO-REPORT: Automatically send PDF to student and Ma'am via Email
            autoSendEmail(newResults);
        }, 1500); // Artificial delay for "loading animation"
    };

    const autoSendEmail = async (currentResults: Results) => {
        try {
            const doc = await generatePDF(currentResults);
            if (!doc) return;
            const pdfBase64 = doc.output("datauristring").split(",")[1];

            await axios.post(`${APP_CONFIG.API_BASE_URL}/api/send-report`, {
                email: formData.email,
                name: formData.name,
                pdfBase64
            });
            console.log("Automatic report sent successfully!");
        } catch (error) {
            console.error("Auto-email failed:", error);
        }
    };

    const handleWhatsAppShare = (type: 'student' | 'teacher') => {
        if (!results) return;

        const summary = `*${APP_CONFIG.APP_NAME} Report*\n\n` +
            `*Student:* ${formData.name}\n` +
            `*Grade:* ${formData.grade}\n` +
            `*Score:* ${results.score}/${results.total} (${Math.round((results.score / results.total) * 100)}%)\n` +
            `*Category:* ${results.category} (${results.badgeText} Badge)\n` +
            `*Time Taken:* ${results.timeTaken}\n\n` +
            `*Strengths:* ${results.strengths.join(", ") || "N/A"}\n` +
            `*Areas to Improve:* ${results.weaknesses.join(", ") || "N/A"}\n\n` +
            `"${results.message}"`;

        const encodedMsg = encodeURIComponent(summary);
        const whatsappUrl = type === 'teacher'
            ? `https://wa.me/${APP_CONFIG.TEACHER_PHONE.replace(/\D/g, '')}?text=${encodedMsg}`
            : `https://wa.me/${formData.phone.replace(/\D/g, '')}?text=${encodedMsg}`;

        window.open(whatsappUrl, '_blank');
    };

    const handleSharePDF = async () => {
        const doc = await generatePDF();
        if (!doc) return;

        const pdfBlob = doc.output('blob');
        const filename = `${APP_CONFIG.APP_NAME.replace(/\s+/g, '_')}_Report_${formData.name.replace(/\s+/g, '_')}.pdf`;
        const file = new File([pdfBlob], filename, { type: 'application/pdf' });

        const shareData = {
            files: [file],
            title: `${APP_CONFIG.APP_NAME} Report`,
            text: APP_CONFIG.WHATSAPP_MESSAGE_TEACHER,
        };

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    handleDownload();
                    window.open(`https://wa.me/${APP_CONFIG.TEACHER_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(shareData.text)}`, '_blank');
                }
            }
        } else {
            handleDownload();
            const waUrl = `https://wa.me/${APP_CONFIG.TEACHER_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(shareData.text)}`;
            window.open(waUrl, '_blank');
            alert("Report Downloaded! Opening WhatsApp chat with Ma'am... Please attach the PDF you just downloaded to the chat.");
        }
    };

    const generatePDF = async (customResults?: Results) => {
        const activeResults = customResults || results;
        if (!activeResults) return null;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Logo Placeholder / Name
        doc.setFontSize(24);
        doc.setTextColor(0, 188, 212); // #00BCD4
        doc.text(APP_CONFIG.APP_NAME, pageWidth / 2, 20, { align: "center" });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(APP_CONFIG.TAGLINE, pageWidth / 2, 27, { align: "center" });

        doc.setDrawColor(0, 188, 212);
        doc.line(20, 32, pageWidth - 20, 32);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Student Name: ${formData.name}`, 20, 45);
        doc.text(`Grade: ${formData.grade}`, 20, 52);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 59);
        doc.text(`Time Taken: ${activeResults.timeTaken}`, 20, 66);

        doc.setFontSize(14);
        doc.text("Test Summary", 20, 80);
        doc.setFontSize(12);
        doc.text(`Score: ${activeResults.score}/${activeResults.total} (${Math.round((activeResults.score / activeResults.total) * 100)}%)`, 20, 88);
        doc.text(`Category: ${activeResults.category} (${activeResults.badgeText} Badge)`, 20, 95);

        // Analysis Table
        doc.setFontSize(14);
        doc.text("Detailed Performance Analysis", 20, 110);

        const tableData = activeResults.analysis.map((item: AnalysisItem, idx: number) => [
            idx + 1,
            item.question,
            item.selected || "No Answer",
            item.correct,
            item.isCorrect ? "Correct" : "Incorrect"
        ]);

        autoTable(doc, {
            startY: 115,
            head: [["#", "Question", "Your Answer", "Correct Answer", "Status"]],
            body: tableData,
            headStyles: { fillColor: [0, 188, 212] },
        });

        const finalY = (doc as any).lastAutoTable.finalY + 15; // eslint-disable-line @typescript-eslint/no-explicit-any

        // Feedback
        doc.setFontSize(14);
        doc.text("Insights & Improvement", 20, finalY);
        doc.setFontSize(11);
        doc.text(`Strengths: ${activeResults.strengths.length > 0 ? activeResults.strengths.join(", ") : "Keep practicing all topics!"}`, 20, finalY + 8);
        doc.text(`Areas for Improvement: ${activeResults.weaknesses.length > 0 ? activeResults.weaknesses.join(", ") : "Focus on maintaining your great score!"}`, 20, finalY + 16);

        // Motivational Message
        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        const splitMessage = doc.splitTextToSize(activeResults.message, pageWidth - 40);
        doc.text(splitMessage, 20, finalY + 30);

        return doc;
    };

    const handleDownload = async () => {
        if (!results) return;
        const doc = await generatePDF();
        if (doc) doc.save(`${APP_CONFIG.APP_NAME.replace(/\s+/g, '_')}_Report_${formData.name.replace(/\s+/g, '_')}.pdf`);
    };

    const handleEmail = async () => {
        if (!results) return;
        setSendingEmail(true);
        try {
            const doc = await generatePDF();
            if (!doc) throw new Error("PDF generation failed");
            const pdfBase64 = doc.output("datauristring").split(",")[1];

            await axios.post(`${APP_CONFIG.API_BASE_URL}/api/send-report`, {
                email: formData.email,
                name: formData.name,
                pdfBase64
            });
            alert("Report emailed successfully to you and ImproMaths!");
        } catch {
            alert("Failed to send email. Please check your network or try again.");
        } finally {
            setSendingEmail(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

                {/* Navbar */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                            <span className="text-white font-black text-2xl">{APP_CONFIG.APP_NAME[0]}</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-800 tracking-tight leading-none">{APP_CONFIG.APP_NAME.split(' ')[0]}</h1>
                            <span className="text-[10px] uppercase tracking-widest text-cyan-500 font-bold">{APP_CONFIG.APP_NAME.split(' ').slice(1).join(' ')}</span>
                        </div>
                    </div>
                    {step === 2 && (
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                <Clock size={14} className="text-cyan-500" />
                                <span className="text-xs font-mono font-bold text-gray-600">{formatTime(timer)}</span>
                            </div>
                            <div className="text-xs font-bold text-gray-400">
                                Question <span className="text-gray-800">{currentQuestionIndex + 1}</span> / {questions.length}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 md:p-12">
                    {loading && step !== 3 && (
                        <div className="flex flex-col items-center justify-center space-y-4 py-20">
                            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
                            <p className="text-gray-500 font-medium animate-pulse">Initializing Test Experience...</p>
                        </div>
                    )}

                    {!loading && (
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step-1"
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -30 }}
                                    className="space-y-8"
                                >
                                    <div className="text-center space-y-3">
                                        <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">{APP_CONFIG.TAGLINE}</h2>
                                        <p className="text-gray-500 max-w-md mx-auto">Take our specialized IGCSE diagnostic test to identify your strengths and unlock your full potential.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Full Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-cyan-500 focus:bg-white outline-none transition-all text-gray-800 font-medium"
                                                    placeholder="Dr. Isaac Newton"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
                                                <input
                                                    type="email"
                                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-cyan-500 focus:bg-white outline-none transition-all text-gray-800 font-medium"
                                                    placeholder="isaac@maths.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">WhatsApp Number (Optional)</label>
                                                <input
                                                    type="tel"
                                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-cyan-500 focus:bg-white outline-none transition-all text-gray-800 font-medium"
                                                    placeholder="+65 98262401"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4 flex flex-col justify-between">
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Select Your Grade</label>
                                                <select
                                                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-cyan-500 focus:bg-white outline-none transition-all text-gray-800 font-bold appearance-none cursor-pointer"
                                                    value={formData.grade}
                                                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                                >
                                                    <option value="6">IGCSE Grade 6</option>
                                                    <option value="7">IGCSE Grade 7</option>
                                                    <option value="8">IGCSE Grade 8</option>
                                                    <option value="9">IGCSE Grade 9</option>
                                                    <option value="10">IGCSE Grade 10</option>
                                                </select>
                                            </div>
                                            <div className="p-4 bg-cyan-50 rounded-2xl border border-cyan-100">
                                                <p className="text-[11px] text-cyan-700 leading-relaxed font-medium">
                                                    The test consists of 10 MCQs with a difficulty level of 3.5/5. Good luck!
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            onClick={startTest}
                                            className="w-full bg-[#00BCD4] hover:bg-[#00ACC1] hover:scale-[1.02] active:scale-95 text-white font-black py-5 rounded-2xl shadow-xl shadow-cyan-200 transition-all flex items-center justify-center space-x-3 group"
                                        >
                                            <span className="text-lg">Begin Assessment</span>
                                            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (navigator.share) {
                                                    navigator.share({
                                                        title: APP_CONFIG.APP_NAME,
                                                        text: APP_CONFIG.SHARE_APP_TEXT,
                                                        url: window.location.origin
                                                    });
                                                } else {
                                                    navigator.clipboard.writeText(window.location.origin);
                                                    alert("Link copied to clipboard! Share it with your friends.");
                                                }
                                            }}
                                            className="px-8 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-cyan-500 font-black py-5 rounded-2xl border border-gray-100 transition-all flex items-center justify-center space-x-2"
                                        >
                                            <RefreshCcw size={18} />
                                            <span className="whitespace-nowrap">Share Quiz</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step-2"
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    className="space-y-8"
                                >
                                    <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                        />
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="inline-flex items-center space-x-2 bg-indigo-50 px-3 py-1 rounded-lg">
                                                <Target size={14} className="text-indigo-600" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{questions[currentQuestionIndex].topic}</span>
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-800 leading-snug">
                                                {questions[currentQuestionIndex].question}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {questions[currentQuestionIndex].options.map((option: string, idx: number) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleAnswer(option)}
                                                    className={`w-full text-left px-8 py-5 rounded-2xl border-2 transition-all group relative overflow-hidden ${answers[currentQuestionIndex] === option
                                                        ? "border-cyan-500 bg-cyan-50 text-cyan-700 shadow-lg shadow-cyan-50"
                                                        : "border-gray-100 hover:border-gray-200 text-gray-600 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <span className="font-bold text-lg">{option}</span>
                                                        {answers[currentQuestionIndex] === option && (
                                                            <CheckCircle size={20} className="text-cyan-500" />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-8">
                                        <button
                                            onClick={prevQuestion}
                                            disabled={currentQuestionIndex === 0}
                                            className="px-6 py-3 text-gray-400 font-bold hover:text-gray-600 disabled:opacity-0 transition-all flex items-center space-x-2"
                                        >
                                            <span>Previous</span>
                                        </button>

                                        {currentQuestionIndex === questions.length - 1 ? (
                                            <button
                                                onClick={calculateResults}
                                                disabled={Object.keys(answers).length < questions.length}
                                                className="bg-[#00BCD4] hover:bg-[#00ACC1] disabled:opacity-50 text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-cyan-200 transition-all transform hover:scale-105"
                                            >
                                                Submit Test
                                            </button>
                                        ) : (
                                            <button
                                                onClick={nextQuestion}
                                                disabled={!answers[currentQuestionIndex]}
                                                className="bg-gray-900 border-2 border-gray-900 hover:bg-black disabled:opacity-30 text-white font-black px-10 py-4 rounded-2xl transition-all flex items-center space-x-3"
                                            >
                                                <span>Next Question</span>
                                                <ChevronRight size={18} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step-3"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-10"
                                >
                                    {loading || !results ? (
                                        <div className="flex flex-col items-center justify-center space-y-4 py-20">
                                            <div className="relative">
                                                <Loader2 className="w-16 h-16 text-cyan-500 animate-spin" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Award size={24} className="text-cyan-500" />
                                                </div>
                                            </div>
                                            <p className="text-gray-500 font-black uppercase tracking-widest text-sm">Analyzing Performance...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-center space-y-6">
                                                <motion.div
                                                    className={`mx-auto w-28 h-28 ${results?.badgeColor} rounded-[2rem] flex items-center justify-center text-white shadow-2xl relative`}
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 0.5 }}
                                                >
                                                    <Award size={56} />
                                                    <div className="absolute -bottom-2 bg-white px-4 py-1 rounded-full shadow-md">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${results?.badgeColor?.replace('bg-', 'text-')}`}>
                                                            {results?.badgeText} Badge
                                                        </span>
                                                    </div>
                                                </motion.div>
                                                <div className="space-y-2">
                                                    <h2 className="text-4xl font-black text-gray-900">{results?.category}</h2>
                                                    <div className="flex items-center justify-center space-x-3">
                                                        <span className="text-2xl font-bold text-cyan-600">{results?.score} / {results?.total}</span>
                                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                        <span className="text-gray-400 font-medium">Accuracy: {Math.round((results?.score / results?.total) * 100)}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 space-y-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                                                        <TrendingUp size={18} className="text-cyan-600" />
                                                    </div>
                                                    <h4 className="font-black text-gray-800 uppercase tracking-widest text-sm">Motivational Feedback</h4>
                                                </div>
                                                <p className="text-gray-700 leading-relaxed font-semibold italic text-lg">
                                                    &ldquo;{results?.message}&rdquo;
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-6 bg-green-50 rounded-3xl border border-green-100 space-y-4">
                                                    <div className="flex items-center space-x-2 text-green-700">
                                                        <CheckCircle size={18} />
                                                        <span className="font-black uppercase tracking-widest text-xs">Top Strengths</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {results?.strengths?.length > 0 ? results.strengths.map((s) => (
                                                            <span key={s} className="bg-white px-3 py-1 rounded-full text-[11px] font-bold text-green-600 shadow-sm">{s}</span>
                                                        )) : <span className="text-xs text-green-600">Keep practicing!</span>}
                                                    </div>
                                                </div>
                                                <div className="p-6 bg-red-50 rounded-3xl border border-red-100 space-y-4">
                                                    <div className="flex items-center space-x-2 text-red-700">
                                                        <AlertCircle size={18} />
                                                        <span className="font-black uppercase tracking-widest text-xs">Improvement Areas</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {results?.weaknesses?.length > 0 ? results.weaknesses.map((s) => (
                                                            <span key={s} className="bg-white px-3 py-1 rounded-full text-[11px] font-bold text-red-600 shadow-sm">{s}</span>
                                                        )) : <span className="text-xs text-red-600">Great overall performance!</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                                    <button
                                                        onClick={handleDownload}
                                                        className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-cyan-500 text-cyan-600 font-black py-5 rounded-2xl hover:bg-cyan-50 transition-all active:scale-95"
                                                    >
                                                        <Download size={22} />
                                                        <span>Download PDF</span>
                                                    </button>
                                                    <button
                                                        onClick={handleEmail}
                                                        disabled={sendingEmail}
                                                        className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-indigo-500 text-indigo-600 font-black py-5 rounded-2xl hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50"
                                                    >
                                                        {sendingEmail ? <Loader2 className="animate-spin" /> : <Mail size={22} />}
                                                        <span>Email Report</span>
                                                    </button>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                                    <button
                                                        onClick={() => handleWhatsAppShare('student')}
                                                        disabled={!formData.phone}
                                                        className="w-full flex items-center justify-center space-x-3 bg-green-500 text-white font-black py-5 rounded-2xl hover:bg-green-600 shadow-xl shadow-green-100 transition-all active:scale-95 disabled:opacity-30"
                                                    >
                                                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.411.001 12.045a11.871 11.871 0 001.594 5.92L0 24l6.18-1.622a11.816 11.816 0 005.867 1.556h.005c6.635 0 12.045-5.411 12.048-12.045a11.758 11.758 0 00-3.468-8.423z" /></svg>
                                                        <span>Share to My WhatsApp</span>
                                                    </button>
                                                    <button
                                                        onClick={handleSharePDF}
                                                        className="w-full flex items-center justify-center space-x-3 bg-[#00BCD4] text-white font-black py-5 rounded-2xl hover:bg-[#00ACC1] shadow-xl shadow-cyan-100 transition-all active:scale-95"
                                                    >
                                                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.411.001 12.045a11.871 11.871 0 001.594 5.92L0 24l6.18-1.622a11.816 11.816 0 005.867 1.556h.005c6.635 0 12.045-5.411 12.048-12.045a11.758 11.758 0 00-3.468-8.423z" /></svg>
                                                        <span>Share PDF to Ma'am</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => { setStep(1); setAnswers({}); setCurrentQuestionIndex(0); setTimer(0); }}
                                                className="flex items-center justify-center space-x-2 mx-auto text-gray-400 hover:text-cyan-600 font-black uppercase tracking-widest text-xs transition-all pt-4"
                                            >
                                                <RefreshCcw size={16} />
                                                <span>Take Test Again</span>
                                            </button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
