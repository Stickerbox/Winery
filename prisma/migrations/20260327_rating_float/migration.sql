-- AlterTable
PRAGMA foreign_keys=OFF;
CREATE TABLE "Wine_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "imagePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "shareToken" TEXT,
    "sharedByUsername" TEXT,
    CONSTRAINT "Wine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Wine_shareToken_key" UNIQUE ("shareToken")
);
INSERT INTO "Wine_new" SELECT "id", "name", "description", CAST("rating" AS REAL), "imagePath", "createdAt", "userId", "shareToken", "sharedByUsername" FROM "Wine";
DROP TABLE "Wine";
ALTER TABLE "Wine_new" RENAME TO "Wine";
PRAGMA foreign_keys=ON;
