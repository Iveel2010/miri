import { z } from "zod";
import { contactRepository } from "@/repositories/contact.repository";

export const contactInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  subject: z.string().max(200).optional().default(""),
  body: z.string().min(1, "Message is required").max(5000),
});

export const contactService = {
  async submit(input: z.infer<typeof contactInputSchema>) {
    return contactRepository.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      subject: input.subject?.trim() || "General Inquiry",
      body: input.body.trim(),
    });
  },

  async list(page = 1, limit = 20) {
    return contactRepository.list(page, limit);
  },
};
