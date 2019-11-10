export class StoreEvolution {
  public static generate(mongoose: any) {
    let model = mongoose.model("Evolution", {
      number: Number,
      comments: String,
      date: Date
    });

    return model;
  }
}
