import { prisma } from "../../utils/prisma";
import { CreateFileDto, UpdateFileDto, FileTreeNode } from "./files.types";

export class FilesService {
  async create(ownerId: string, dto: CreateFileDto) {
    if (!dto.name?.trim() || !dto.path?.trim() || !dto.sessionId?.trim()) {
      throw new Error("Invalid file payload");
    }

    if (dto.parentId) {
      const parent = await prisma.file.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.sessionId !== dto.sessionId) {
        throw new Error("Invalid parent: not found in this session");
      }
      if (!parent.isFolder) {
        throw new Error("Invalid parent: target is not a folder");
      }
    }

    return prisma.file.create({
      data: {
        name: dto.name.trim(),
        path: dto.path,
        isFolder: dto.isFolder,
        parentId: dto.parentId ?? null,
        sessionId: dto.sessionId,
        ownerId,
      },
    });
  }

  async getTree(sessionId: string): Promise<FileTreeNode[]> {
    const files = await prisma.file.findMany({
      where: { sessionId },
      orderBy: [{ isFolder: "desc" }, { name: "asc" }],
    });

    return this.buildTree(files, null);
  }

  private buildTree(
    files: { id: string; name: string; path: string; isFolder: boolean; parentId: string | null }[],
    parentId: string | null,
    visiting: Set<string> = new Set()
  ): FileTreeNode[] {
    return files
      .filter((f) => f.parentId === parentId)
      .map((f) => {
        if (visiting.has(f.id)) {
          return { id: f.id, name: f.name, path: f.path, isFolder: f.isFolder, parentId: f.parentId, children: [] };
        }
        const nextVisiting = new Set(visiting);
        nextVisiting.add(f.id);

        return {
          id: f.id,
          name: f.name,
          path: f.path,
          isFolder: f.isFolder,
          parentId: f.parentId,
          children: f.isFolder ? this.buildTree(files, f.id, nextVisiting) : undefined,
        };
      });
  }

  async getById(id: string) {
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) throw new Error("File not found");
    return file;
  }

  async update(id: string, dto: UpdateFileDto) {
    return prisma.file.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return prisma.file.delete({ where: { id } });
  }

  async move(id: string, newParentId: string | null, newPath: string) {
    if (newParentId === id) {
      throw new Error("Cannot move a file into itself");
    }

    if (newParentId) {
      const target = await prisma.file.findUnique({ where: { id } });
      const newParent = await prisma.file.findUnique({ where: { id: newParentId } });
      if (!target || !newParent) throw new Error("File or target parent not found");
      if (newParent.sessionId !== target.sessionId) {
        throw new Error("Cannot move file across sessions");
      }
      if (!newParent.isFolder) {
        throw new Error("Target is not a folder");
      }

      let cursor: string | null = newParentId;
      const seen = new Set<string>();
      while (cursor) {
        if (cursor === id) throw new Error("Cannot move a folder into its own descendant");
        if (seen.has(cursor)) break;
        seen.add(cursor);
        const node: { parentId: string | null } | null = await prisma.file.findUnique({
          where: { id: cursor },
          select: { parentId: true },
        });
        cursor = node?.parentId ?? null;
      }
    }

    return prisma.file.update({
      where: { id },
      data: { parentId: newParentId, path: newPath },
    });
  }
}

export const filesService = new FilesService();
