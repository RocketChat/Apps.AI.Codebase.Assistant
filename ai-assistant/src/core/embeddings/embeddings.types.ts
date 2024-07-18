export interface IEmbeddingModel {
    generate(text: string): Promise<number[] | null>;
}
