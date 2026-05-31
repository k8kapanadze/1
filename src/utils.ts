import { RawQuestion, PlayableQuestion, SubjectGroup } from './types';

export function parseQuestionFile(text: string, fileName: string): RawQuestion[] {
  const lines = text.split(/\r?\n/);
  const questions: RawQuestion[] = [];
  let currentQuestion: Partial<RawQuestion> | null = null;
  let originalIdx = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('////')) {
      if (currentQuestion && currentQuestion.text && (currentQuestion.correctAnswer || currentQuestion.incorrectAnswers?.length)) {
        questions.push({
          id: `${fileName}-${originalIdx}-${Math.random().toString(36).substring(2, 9)}`,
          text: currentQuestion.text,
          correctAnswer: currentQuestion.correctAnswer || '',
          incorrectAnswers: currentQuestion.incorrectAnswers || [],
          sourceFile: fileName,
          originalIndex: originalIdx++,
        } as RawQuestion);
      }

      currentQuestion = {
        text: line.substring(4).trim(),
        incorrectAnswers: [],
      };
    } else if (line.startsWith('///')) {
      if (!currentQuestion) {
        currentQuestion = { text: 'უტექსტო კითხვა', incorrectAnswers: [] };
      }
      currentQuestion.incorrectAnswers?.push(line.substring(3).trim());
    } else if (line.startsWith('//') && !line.startsWith('///') && !line.startsWith('////')) {
      if (!currentQuestion) {
        currentQuestion = { text: 'უტექსტო კითხვა', incorrectAnswers: [] };
      }
      currentQuestion.correctAnswer = line.substring(2).trim();
    } else if (currentQuestion) {
      if (!currentQuestion.correctAnswer && (!currentQuestion.incorrectAnswers || currentQuestion.incorrectAnswers.length === 0)) {
        currentQuestion.text = (currentQuestion.text ? currentQuestion.text + '\n' : '') + line;
      }
    }
  }

  if (currentQuestion && currentQuestion.text && (currentQuestion.correctAnswer || currentQuestion.incorrectAnswers?.length)) {
    questions.push({
      id: `${fileName}-${originalIdx}-${Math.random().toString(36).substring(2, 9)}`,
      text: currentQuestion.text,
      correctAnswer: currentQuestion.correctAnswer || '',
      incorrectAnswers: currentQuestion.incorrectAnswers || [],
      sourceFile: fileName,
      originalIndex: originalIdx,
    } as RawQuestion);
  }

  return questions;
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function prepareSessionQuestions(
  rawQuestions: RawQuestion[],
  shuffleQuestions: boolean,
  shuffleOptions: boolean
): PlayableQuestion[] {
  let list = [...rawQuestions];
  if (shuffleQuestions) {
    list = shuffleArray(list);
  }

  return list.map((q) => {
    const rawOptions = [q.correctAnswer, ...q.incorrectAnswers].filter(Boolean);
    let options = [...rawOptions];
    if (shuffleOptions) {
      options = shuffleArray(options);
    }
    return {
      id: q.id,
      text: q.text,
      correctAnswer: q.correctAnswer,
      options,
      rawOptions,
      originalIndex: q.originalIndex,
      sourceFile: q.sourceFile,
      subject: q.subject,
    };
  });
}

const SUBJECT_RULES: { subject: string; keywords: string[] }[] = [
  { subject: 'კარდიოლოგია', keywords: ['გულ', 'კარდიო', 'მიოკარდ', 'ეკგ', 'არტერიულ', 'ჰიპერტენზ', 'აორტ', 'მიტრალ', 'არითმ', 'სტენოკარდ', 'პარკუჭ', 'წინაგულ'] },
  { subject: 'პულმონოლოგია', keywords: ['ფილტვ', 'ბრონქ', 'ასთმ', 'პნევმ', 'ტუბერკულ', 'სუნთქ', 'პლევრ', 'ემფიზემ', 'ხველ'] },
  { subject: 'გასტროენტეროლოგია', keywords: ['კუჭ', 'ნაწლავ', 'ღვიძლ', 'ჰეპატ', 'ციროზ', 'პანკრეატ', 'ნაღვლ', 'გასტრ', 'წყლულ', 'დიარე', 'ქოლეცისტ'] },
  { subject: 'ნეფროლოგია', keywords: ['თირკმ', 'შარდ', 'გლომერულ', 'პიელონეფრ', 'კრეატინინ', 'ურემ', 'ნეფრ', 'პროტეინურ'] },
  { subject: 'ენდოკრინოლოგია', keywords: ['დიაბეტ', 'ინსულინ', 'თირეო', 'ფარისებრ', 'ჰიპოფიზ', 'კორტიზოლ', 'ადრენალ', 'გლუკოზ', 'ენდოკრინ'] },
  { subject: 'ჰემატოლოგია', keywords: ['ანემი', 'ლეიკემ', 'ჰემოგლობინ', 'ერითროციტ', 'თრომბოციტ', 'ლეიკოციტ', 'კოაგულ', 'ჰემატოლოგ'] },
  { subject: 'ნევროლოგია', keywords: ['ინსულტ', 'ტვინ', 'ნერვ', 'ეპილეფ', 'მენინგ', 'პარკინსონ', 'ნევროლოგ', 'პარეზ', 'კრუნჩხვ'] },
  { subject: 'ინფექციური დაავადებები', keywords: ['ინფექც', 'ვირუს', 'ბაქტერ', 'სეფს', 'ცხელებ', 'ანტიბიოტიკ', 'მალარია', 'ტოქსოპლაზმ', 'აივ'] },
  { subject: 'რევმატოლოგია', keywords: ['ართრიტ', 'რევმატ', 'ვასკულიტ', 'მგლურა', 'სკლეროდერმ', 'სახსრ', 'პოდაგრ'] },
  { subject: 'დერმატოლოგია', keywords: ['კან', 'დერმატ', 'გამონაყარ', 'ფსორიაზ', 'ეგზემ', 'ქავილ', 'ბუშტუკ'] },
  { subject: 'ფსიქიატრია', keywords: ['დეპრესი', 'ფსიქოზ', 'შიზოფრენ', 'შფოთ', 'ალკოჰოლ', 'ნარკოტ', 'ფსიქიატრ'] },
];

export function detectQuestionSubject(question: RawQuestion): string {
  const text = `${question.text} ${question.correctAnswer} ${question.incorrectAnswers.join(' ')}`.toLowerCase();
  const match = SUBJECT_RULES.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)));
  return match?.subject || 'ზოგადი თერაპია';
}

export function attachSubjects(questions: RawQuestion[]): RawQuestion[] {
  return questions.map((question) => ({
    ...question,
    subject: detectQuestionSubject(question),
  }));
}

export function buildSubjectGroups(questions: RawQuestion[]): SubjectGroup[] {
  const counts = new Map<string, number>();
  questions.forEach((question) => {
    const subject = question.subject || detectQuestionSubject(question);
    counts.set(subject, (counts.get(subject) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count);
}

export function serializeToCustomFormat(questions: RawQuestion[]): string {
  return questions
    .map((q) => {
      const qText = `//// ${q.text}`;
      const correct = `// ${q.correctAnswer}`;
      const incorrects = q.incorrectAnswers.map((opt) => `/// ${opt}`).join('\n');
      return `${qText}\n${correct}\n${incorrects}`;
    })
    .join('\n\n');
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
