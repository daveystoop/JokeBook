-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "monthlyAmount" REAL NOT NULL,
    "planDetails" TEXT,
    "contractEnds" DATETIME,
    "accountNumber" TEXT,
    "phoneNumber" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "planDetails" TEXT NOT NULL,
    "monthlyAmount" REAL NOT NULL,
    "promoAmount" REAL,
    "promoDuration" INTEGER,
    "annualSaving" REAL NOT NULL,
    "sourceNote" TEXT,
    "foundAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewId" TEXT,
    CONSTRAINT "Deal_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billId" TEXT NOT NULL,
    "dealId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "commitBy" DATETIME,
    "monthlySaving" REAL NOT NULL,
    "annualSaving" REAL NOT NULL,
    "method" TEXT,
    "draftEmail" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Action_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSavingFound" REAL NOT NULL,
    "dealsFound" INTEGER NOT NULL,
    "summary" TEXT
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT,
    "mortgageBank" TEXT,
    "mortgageRate" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
