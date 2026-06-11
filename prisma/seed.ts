
import { PrismaClient } from "@prisma/client";
import { DEPARTMENT_DRILLS } from "@/lib/department-drills";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding drills...");

  for (const department in DEPARTMENT_DRILLS) {
    for (const drill of DEPARTMENT_DRILLS[department]) {
      await prisma.drill.upsert({
        where: { externalId: drill.id },
        update: {
          name: drill.name,
          description: drill.description,
          duration: drill.duration,
          difficulty: drill.difficulty,
          department: drill.department,
          phase: drill.phase,
          coachingPoints: drill.coachingPoints,
          equipment: drill.equipment,
        },
        create: {
          externalId: drill.id,
          name: drill.name,
          description: drill.description,
          duration: drill.duration,
          difficulty: drill.difficulty,
          department: drill.department,
          phase: drill.phase,
          coachingPoints: drill.coachingPoints,
          equipment: drill.equipment,
        },
      });
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());