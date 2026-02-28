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
    AlertCircle,
    User,
    MessageCircle
} from "lucide-react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { APP_CONFIG } from "@/config";

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
    const [timer, setTimer] = useState(0);
    const [emailStatus, setEmailStatus] = useState<"sending" | "success" | "error" | null>(null);
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
                ? `Close your eyes for a moment and truly visualize yourself achieving absolute mathematical mastery. You have just demonstrated an extraordinary level of skill and a deep, intuitive understanding of numbers. As you look at these results, notice the feeling of certainty and pride expanding within you. This is not just a score; it is a clear reflection of your immense potential and sharp intellect. Imagine how much further you can go when you unlock every hidden capability of your mind. You possess a rare brilliance, and right now, you are standing on the precipice of greatness. The only question now is: how extraordinary do you want your future to be? To harness this momentum, refine your elite skills, and build a lasting legacy of success, take action right now. Contact ImproMaths immediately at ${APP_CONFIG.TEACHER_PHONE}. Let us guide you to the absolute pinnacle of academic excellence!`
                : category === "Average"
                    ? `Take a deep breath and acknowledge the incredible effort you have just put in. You are standing right at the threshold of a massive breakthrough. Every correct answer here is undeniable proof of the vast, untapped reservoir of intelligence waiting to be fully awakened within you. As you review your performance, notice how the areas for improvement are simply exciting opportunities for rapid growth. Visualize yourself easily understanding complex concepts, feeling a surge of confidence with every new problem you solve. You already have the strong foundation needed; now it is time to build your masterpiece. Imagine the pride you will feel as those minor doubts turn into absolute certainties. Your transformation into a highly confident mathematical achiever is closer than you think. Take the deciding step today. Contact ImproMaths immediately at ${APP_CONFIG.TEACHER_PHONE}—your path to absolute mastery begins with this single action!`
                    : `Right now, in this very moment, you are taking the most powerful and important step of your journey—the step of discovery. Every master, every genius, was once exactly where you are today. As you look at your results, realize that these numbers do not define your limits; they merely show you exactly where your incredible journey of growth begins. Notice that spark of curiosity and determination within you. Imagine what it will feel like when the confusion lifts, replaced by a radiant, rock-solid confidence. You possess an inner strength and a profound capacity to learn that you haven't even fully tapped into yet. The fact that you took this test proves you have the courage to grow. Now, imagine having the perfect guidance to unlock your true potential, turning every challenge into a remarkable triumph. You don't have to do this alone. Reach out and take control of your future right now. Contact ImproMaths immediately at ${APP_CONFIG.TEACHER_PHONE}—let’s start building your incredible success story together, today!`;


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

            // AUTO-REPORT: Automatically send PDF to student via Email & Ma'am via Email and WhatsApp Graph API
            autoSendEmail(newResults);
        }, 1500); // Artificial delay for "loading animation"
    };

    const autoSendEmail = async (currentResults: Results) => {
        try {
            setEmailStatus("sending");
            const doc = await generatePDF(currentResults);
            if (!doc) return;
            const pdfBase64 = doc.output("datauristring").split(",")[1];

            const response = await axios.post(`${APP_CONFIG.API_BASE_URL}/api/send-report`, {
                email: formData.email,
                name: formData.name,
                grade: formData.grade,
                score: currentResults.score,
                category: currentResults.category,
                pdfBase64
            });

            if (response.status === 200) {
                setEmailStatus("success");
                console.log("Automatic report sent successfully!");
            } else {
                setEmailStatus("error");
            }
        } catch (error) {
            console.error("Auto-email failed:", error);
            setEmailStatus("error");
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

    const handleSharePDF = async (customResults?: Results) => {
        const doc = await generatePDF(customResults);
        if (!doc) return;

        const pdfBlob = doc.output('blob');
        const studentName = formData.name || "Student";
        const filename = `${APP_CONFIG.APP_NAME.replace(/\s+/g, '_')}_Report_${studentName.replace(/\s+/g, '_')}.pdf`;
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
                    const waUrl = `https://wa.me/${APP_CONFIG.TEACHER_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(shareData.text)}`;
                    window.open(waUrl, '_blank');
                }
            }
        } else {
            handleDownload();
            const waUrl = `https://wa.me/${APP_CONFIG.TEACHER_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(shareData.text)}`;
            window.open(waUrl, '_blank');
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
                                            {/* Results Header with Avatar */}
                                            <div className="text-center space-y-4">
                                                <div className="relative mx-auto w-24 h-24 mb-6">
                                                    <div className="absolute inset-0 bg-orange-500 rounded-3xl transform rotate-6 scale-95 opacity-20"></div>
                                                    <div className="relative w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl overflow-hidden">
                                                        <User size={48} className="text-white relative z-10" />
                                                        <div className="absolute bottom-0 w-full h-1/3 bg-white/20"></div>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <h2 className="text-4xl font-black text-gray-900 tracking-tight">{results.category}</h2>
                                                    <div className="flex items-center justify-center space-x-3 text-lg">
                                                        <span className="font-extrabold text-cyan-500">{results.score} / {results.total}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-gray-400 font-bold">Accuracy: {Math.round((results.score / results.total) * 100)}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* UI for Email Auto-sending Status */}
                                            {emailStatus && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`p-4 rounded-3xl flex items-center justify-center space-x-3 border-2 ${emailStatus === 'sending' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                                                        emailStatus === 'success' ? 'bg-green-50 border-green-100 text-green-600' :
                                                            'bg-red-50 border-red-100 text-red-600'
                                                        }`}>
                                                    {emailStatus === 'sending' && <Loader2 className="w-5 h-5 animate-spin" />}
                                                    {emailStatus === 'success' && <CheckCircle className="w-5 h-5" />}
                                                    {emailStatus === 'error' && <AlertCircle className="w-5 h-5" />}
                                                    <span className="font-bold text-sm">
                                                        {emailStatus === 'sending' && 'Automatically sending diagnostic report via Email and WhatsApp...'}
                                                        {emailStatus === 'success' && 'Diagnostic report securely emailed and sent to ImproMaths via WhatsApp!'}
                                                        {emailStatus === 'error' && 'Failed to automate report delivery. Please download it.'}
                                                    </span>
                                                </motion.div>
                                            )}

                                            {/* Motivational Feedback Block */}
                                            <div className="bg-gray-50/80 rounded-[2.5rem] p-8 md:p-10 border border-gray-100 space-y-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-cyan-100/50 rounded-xl flex items-center justify-center">
                                                        <TrendingUp size={20} className="text-cyan-600" />
                                                    </div>
                                                    <h4 className="font-black text-gray-400 uppercase tracking-[0.2em] text-[10px]">Motivational Feedback</h4>
                                                </div>
                                                <p className="text-gray-700 leading-relaxed font-bold italic text-lg md:text-xl md:px-4">
                                                    &ldquo;{results.message}&rdquo;
                                                </p>
                                            </div>

                                            {/* Strengths & Weaknesses Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="p-8 bg-green-50/50 rounded-[2.5rem] border border-green-100 space-y-6">
                                                    <div className="flex items-center space-x-3 text-green-700">
                                                        <CheckCircle size={20} />
                                                        <span className="font-black uppercase tracking-[0.15em] text-[10px]">Top Strengths</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2.5">
                                                        {results.strengths.length > 0 ? results.strengths.map((s) => (
                                                            <span key={s} className="bg-white px-4 py-2 rounded-full text-[11px] font-black text-green-600 shadow-sm border border-green-50">{s}</span>
                                                        )) : <span className="text-xs text-green-600 font-bold">Keep growing!</span>}
                                                    </div>
                                                </div>
                                                <div className="p-8 bg-red-50/50 rounded-[2.5rem] border border-red-100 space-y-6">
                                                    <div className="flex items-center space-x-3 text-red-700">
                                                        <AlertCircle size={20} />
                                                        <span className="font-black uppercase tracking-[0.15em] text-[10px]">Improvement Areas</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2.5">
                                                        {results.weaknesses.length > 0 ? results.weaknesses.map((s) => (
                                                            <span key={s} className="bg-white px-4 py-2 rounded-full text-[11px] font-black text-red-600 shadow-sm border border-red-50">{s}</span>
                                                        )) : <span className="text-xs text-red-700 font-bold">Excellent work!</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <button
                                                    onClick={handleDownload}
                                                    className="flex flex-col items-center justify-center space-y-2 bg-white border-2 border-cyan-500 text-cyan-600 font-black py-4 px-2 rounded-3xl hover:bg-cyan-50 transition-all active:scale-95 shadow-lg shadow-cyan-50/50 text-center leading-tight"
                                                >
                                                    <Download size={24} />
                                                    <span className="text-sm">Download PDF</span>
                                                </button>

                                                <button
                                                    onClick={() => handleWhatsAppShare('student')}
                                                    disabled={!formData.phone}
                                                    className="flex flex-col items-center justify-center space-y-2 bg-[#25D366] text-white font-black py-4 px-2 rounded-3xl hover:bg-[#22c35e] transition-all active:scale-95 shadow-lg shadow-green-100 disabled:opacity-30 text-center leading-tight"
                                                >
                                                    <MessageCircle size={24} />
                                                    <span className="text-sm">Share to My WhatsApp</span>
                                                </button>

                                                <button
                                                    onClick={() => handleSharePDF()}
                                                    className="flex flex-col items-center justify-center space-y-2 bg-[#00BCD4] text-white font-black py-4 px-2 rounded-3xl hover:bg-[#00ACC1] transition-all active:scale-95 shadow-lg shadow-cyan-100 text-center leading-tight"
                                                >
                                                    <MessageCircle size={24} />
                                                    <span className="text-sm">Share PDF to Ma'am</span>
                                                </button>
                                            </div>

                                            {/* Footer Action */}
                                            <button
                                                onClick={() => { setStep(1); setAnswers({}); setCurrentQuestionIndex(0); setTimer(0); }}
                                                className="flex items-center justify-center space-x-2 mx-auto text-gray-400 hover:text-cyan-600 font-black uppercase tracking-[0.2em] text-[10px] transition-all pt-8"
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
