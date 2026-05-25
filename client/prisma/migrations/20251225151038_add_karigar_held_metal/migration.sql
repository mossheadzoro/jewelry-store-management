-- CreateTable
CREATE TABLE "KarigarHeldMetal" (
    "id" TEXT NOT NULL,
    "karigarId" TEXT NOT NULL,
    "purity" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KarigarHeldMetal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KarigarHeldMetal_karigarId_purity_key" ON "KarigarHeldMetal"("karigarId", "purity");

-- AddForeignKey
ALTER TABLE "KarigarHeldMetal" ADD CONSTRAINT "KarigarHeldMetal_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
