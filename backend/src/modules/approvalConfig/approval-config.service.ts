import { prisma } from '../../config/db';
import { AppError } from '../../utils/app-error';

type ApprovalStepInput = {
  stepOrder: number;
  approverId: string;
};

type CreateApprovalConfigInput = {
  steps: ApprovalStepInput[];
};

type ApprovalConfigResponse = {
  id: string;
  companyId: string;
  createdAt: Date;
  steps: Array<{
    id: string;
    stepOrder: number;
    approverId: string;
  }>;
};

const normalizeSteps = (steps: ApprovalStepInput[]): ApprovalStepInput[] => {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new AppError(400, 'steps is required and must be a non-empty array.');
  }

  const normalized = steps
    .map((step) => ({
      stepOrder: Number(step.stepOrder),
      approverId: String(step.approverId ?? '').trim(),
    }))
    .sort((a, b) => a.stepOrder - b.stepOrder);

  const seen = new Set<number>();

  normalized.forEach((step, index) => {
    if (!Number.isInteger(step.stepOrder) || step.stepOrder <= 0) {
      throw new AppError(400, 'stepOrder must be a positive integer.');
    }

    if (!step.approverId) {
      throw new AppError(400, 'approverId is required for each step.');
    }

    if (seen.has(step.stepOrder)) {
      throw new AppError(400, 'stepOrder values must be unique.');
    }

    seen.add(step.stepOrder);

    if (step.stepOrder !== index + 1) {
      throw new AppError(400, 'steps must be sequential starting from 1.');
    }
  });

  return normalized;
};

export const createApprovalConfig = async (
  companyId: string,
  input: CreateApprovalConfigInput,
): Promise<ApprovalConfigResponse> => {
  const steps = normalizeSteps(input.steps);

  const approverIds = Array.from(new Set(steps.map((step) => step.approverId)));

  const approvers = await prisma.user.findMany({
    where: {
      id: { in: approverIds },
      companyId,
      isActive: true,
    },
    select: { id: true },
  });

  if (approvers.length !== approverIds.length) {
    throw new AppError(400, 'All approvers must be active users in the same company.');
  }

  const config = await prisma.$transaction(
    async (tx: {
      approvalConfig: typeof prisma.approvalConfig;
      approvalStep: typeof prisma.approvalStep;
    }) => {
      const existing = await tx.approvalConfig.findUnique({
        where: { companyId },
        select: { id: true },
      });

      if (existing) {
        await tx.approvalStep.deleteMany({ where: { configId: existing.id } });
        await tx.approvalConfig.delete({ where: { id: existing.id } });
      }

      const createdConfig = await tx.approvalConfig.create({
        data: { companyId },
      });

      await tx.approvalStep.createMany({
        data: steps.map((step) => ({
          configId: createdConfig.id,
          stepOrder: step.stepOrder,
          approverId: step.approverId,
        })),
      });

      return tx.approvalConfig.findUnique({
        where: { id: createdConfig.id },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
            select: {
              id: true,
              stepOrder: true,
              approverId: true,
            },
          },
        },
      });
    },
  );

  if (!config) {
    throw new AppError(500, 'Failed to create approval configuration.');
  }

  return config;
};
