import { prisma } from "@/lib/prisma";
import type { Prisma, Role, User } from "@prisma/client";

// Fields safe to return to clients (omit secrets).
export const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  verified: true,
  bio: true,
  // Artist contact information (returned only to the owner / dashboard).
  phone: true,
  facebook: true,
  instagram: true,
  telegram: true,
  whatsapp: true,
  location: true,
  preferredContactMethod: true,
  responseTime: true,
  showPhone: true,
  showEmail: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const userRepository = {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: safeUserSelect });
  },

  /** Artist profile incl. contact fields + artwork count (for public view). */
  async findByIdWithContact(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        ...safeUserSelect,
        _count: { select: { artworks: true } },
      },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findByVerificationToken(token: string) {
    return prisma.user.findFirst({ where: { verificationToken: token } });
  },

  async findByResetToken(token: string) {
    return prisma.user.findFirst({ where: { resetToken: token } });
  },

  async create(data: {
    name: string;
    email: string;
    password: string;
    role?: Role;
    avatar?: string | null;
    bio?: string | null;
    emailVerified?: boolean;
  }) {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        emailVerified: data.emailVerified ? new Date() : null,
      },
      select: safeUserSelect,
    });
  },

  async update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<Omit<User, "password"> & { id: string }> {
    return prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    }) as unknown as Omit<User, "password"> & { id: string };
  },

  async setVerification(id: string, token: string | null) {
    return prisma.user.update({
      where: { id },
      data: { verificationToken: token },
    });
  },

  async markVerified(id: string) {
    return prisma.user.update({
      where: { id },
      data: { emailVerified: new Date(), verificationToken: null },
    });
  },

  async setResetToken(id: string, token: string, expires: Date) {
    return prisma.user.update({
      where: { id },
      data: { resetToken: token, resetTokenExpires: expires },
    });
  },

  async clearResetToken(id: string) {
    return prisma.user.update({
      where: { id },
      data: { resetToken: null, resetTokenExpires: null },
    });
  },

  async list(query: { role?: Role; search?: string; skip?: number; take?: number }) {
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: safeUserSelect,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);
    return { items, total };
  },

  async count(where: Prisma.UserWhereInput = {}) {
    return prisma.user.count({ where });
  },

  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
