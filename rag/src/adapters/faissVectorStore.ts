export class FaissVectorStoreAdapter {
  async initialize(): Promise<void> {
    throw new Error("FAISS adapter is intended for local experimentation and is not implemented here.");
  }
}
