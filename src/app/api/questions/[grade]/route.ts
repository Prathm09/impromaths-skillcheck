import { NextResponse } from 'next/server';
import questionsGrade6 from '@/data/questions_grade6.json';
import questionsGrade7 from '@/data/questions_grade7.json';
import questionsGrade8 from '@/data/questions_grade8.json';
import questionsGrade9 from '@/data/questions_grade9.json';
import questionsGrade10 from '@/data/questions_grade10.json';

export async function GET(request: Request, { params }: { params: { grade: string } }) {
    const { grade } = params;
    let qBank: any[] = [];

    if (grade === '6') qBank = questionsGrade6;
    else if (grade === '7') qBank = questionsGrade7;
    else if (grade === '8') qBank = questionsGrade8;
    else if (grade === '9') qBank = questionsGrade9;
    else if (grade === '10') qBank = questionsGrade10;
    else {
        return NextResponse.json({ message: "Grade level not found." }, { status: 404 });
    }

    // Shuffle questions and select 10
    const shuffledQuestions = [...qBank]
        .sort(() => 0.5 - Math.random())
        .slice(0, 10)
        .map(q => {
            // Shuffle the options within each question
            const shuffledOptions = [...q.options].sort(() => 0.5 - Math.random());
            return {
                ...q,
                options: shuffledOptions
            };
        });

    return NextResponse.json(shuffledQuestions);
}
