import { generateScenePrompt } from "../../lib/video.js";

describe("generateScenePrompt", () => {
  test("returns base scene with no story", () => {
    var prompt = generateScenePrompt("Emma", null);
    expect(prompt).toContain("cute colorful animated");
    expect(prompt).toContain("musical notes");
  });

  test("returns base scene with empty story", () => {
    var prompt = generateScenePrompt("Emma", "");
    expect(prompt).toContain("cute colorful animated");
  });

  test("adds dinosaurs when story mentions dinosaur", () => {
    var prompt = generateScenePrompt("Emma", "She loves playing with her dinosaur toys");
    expect(prompt).toContain("dinosaurs");
  });

  test("adds space theme for space-related stories", () => {
    var prompt = generateScenePrompt("Liam", "He wants to be an astronaut and fly a rocket");
    expect(prompt).toContain("outer space");
    expect(prompt).toContain("planets");
  });

  test("adds space theme for star keyword", () => {
    var prompt = generateScenePrompt("Liam", "He loves looking at the stars");
    expect(prompt).toContain("outer space");
  });

  test("adds ocean theme for swimming stories", () => {
    var prompt = generateScenePrompt("Mia", "She loves to swim with fish");
    expect(prompt).toContain("Underwater");
    expect(prompt).toContain("fish");
  });

  test("adds castle theme for princess stories", () => {
    var prompt = generateScenePrompt("Mia", "She wants to be a princess");
    expect(prompt).toContain("castle");
  });

  test("adds animal theme for pet stories", () => {
    var prompt = generateScenePrompt("Noah", "He has a pet dog named Rex");
    expect(prompt).toContain("cartoon animals");
  });

  test("adds rainbow theme for color stories", () => {
    var prompt = generateScenePrompt("Ava", "She loves to paint and draw rainbows");
    expect(prompt).toContain("Rainbows");
    expect(prompt).toContain("paint");
  });

  test("combines multiple themes when story has multiple keywords", () => {
    var prompt = generateScenePrompt("Max", "He loves dinosaurs and wants to fly a rocket to space");
    expect(prompt).toContain("dinosaurs");
    expect(prompt).toContain("outer space");
  });

  test("is case insensitive for keyword matching", () => {
    var prompt = generateScenePrompt("Emma", "She loves DINOSAURS");
    expect(prompt).toContain("dinosaurs");
  });
});
