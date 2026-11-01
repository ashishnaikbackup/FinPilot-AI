import { describe, expect, it } from "vitest";
import { MENTOR_FALLBACK, answerMentor, mentorTopicIds } from "./mentor";

describe("answerMentor", () => {
  it("answers 'start investing in mutual funds' with fund guidance, not the no-income script (regression)", () => {
    expect(mentorTopicIds("How do I start investing in mutual funds?")).toContain("sip");
    expect(mentorTopicIds("How do I start investing in mutual funds?")).not.toContain("no-money");
  });
  it("combines two topics, e.g. SIP vs FD", () => {
    const ids = mentorTopicIds("Explain SIP vs FD");
    expect(ids).toEqual(expect.arrayContaining(["sip", "fixed-income"]));
    expect(answerMentor("Explain SIP vs FD")).toContain("A SIP is a way");
    expect(answerMentor("Explain SIP vs FD")).toContain("An FD is a bank deposit");
  });
  it("puts scam safety first", () => {
    expect(mentorTopicIds("a telegram group promises guaranteed returns on stocks")[0]).toBe("scam");
  });
  it("recognises a zero-money start but not numbers that merely contain a zero", () => {
    expect(mentorTopicIds("Build a starting plan with ₹0")).toContain("no-money");
    expect(mentorTopicIds("I have 10000 saved")).not.toContain("no-money");
    expect(mentorTopicIds("returns of 10.5% a year")).not.toContain("no-money");
  });
  it("falls back honestly and never claims to be generative or personalised advice", () => {
    expect(answerMentor("qwerty zzz")).toBe(MENTOR_FALLBACK);
    expect(MENTOR_FALLBACK).toMatch(/not a generative AI model/);
  });
  it("never promises returns", () => {
    for (const q of ["sip", "stock", "ipo", "gold", "crypto", "bond", "global", "tax", "risk", "job"]) {
      expect(answerMentor(q).toLowerCase()).not.toMatch(/guaranteed (return|profit)s? (are|is) |you will (earn|make)/);
    }
  });
});
