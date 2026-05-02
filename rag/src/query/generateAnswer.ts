export interface AnswerGenerator {
  generate(prompt: string): Promise<string>;
}
