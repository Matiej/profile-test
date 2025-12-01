export type ClientQuestionDto = {
    id: string;
    questionKey: string;
    statementCategory: string;
    supportingStatement: string;
    limitingStatement: string;
};

export type ClientTestDto = {
    testName: string;
    descriptionBefore: string;
    descriptionAfter: string;
    publicToken: string;
    submissionId: string;
    clientQuestions: ClientQuestionDto[];
};

export type StatementKind = 'supporting' | 'limiting';
export type AnswerValue = -2 | -1 | 0 | 1 | 2;

// pytanie z wylosowanym ułożeniem lewo/prawo
export type PreparedQuestion = ClientQuestionDto & {
    leftText: string;
    rightText: string;
    leftKind: StatementKind;
    rightKind: StatementKind;
};

export type QuestionAnswer = {
    questionId: string;
    value: AnswerValue | null;
    leftKind: StatementKind;
    rightKind: StatementKind;
};