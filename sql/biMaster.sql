CREATE DATABASE IF NOT EXISTS biMaster;
USE biMaster;

CREATE TABLE
  `apiLogs` (
    `id` int NOT NULL AUTO_INCREMENT,
    `formName` varchar(2000) COLLATE latin1_spanish_ci NOT NULL DEFAULT '',
    `formType` varchar(45) COLLATE latin1_spanish_ci DEFAULT NULL,
    `source` varchar(45) COLLATE latin1_spanish_ci DEFAULT NULL,
    `class` varchar(45) COLLATE latin1_spanish_ci DEFAULT NULL,
    `documentId` char(36) COLLATE latin1_spanish_ci DEFAULT NULL,
    `timezone` varchar(100) COLLATE latin1_spanish_ci DEFAULT NULL,
    `browser` varchar(100) COLLATE latin1_spanish_ci DEFAULT NULL,
    `ip` varchar(45) COLLATE latin1_spanish_ci DEFAULT NULL,
    `userId` varchar(45) COLLATE latin1_spanish_ci DEFAULT NULL,
    `action` varchar(200) COLLATE latin1_spanish_ci DEFAULT NULL,
    `method` json DEFAULT NULL,
    `jDoc` json DEFAULT NULL,
    `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `id` (`id`),
    KEY `documentId` (`documentId`),
    KEY `action` (`action`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 31405 DEFAULT CHARSET = latin1 COLLATE = latin1_spanish_ci


CREATE TABLE
  `awsQuickSightList` (
    `id` int NOT NULL AUTO_INCREMENT,
    `documentId` char(36) COLLATE latin1_spanish_ci NOT NULL,
    `assetId` varchar(255) COLLATE latin1_spanish_ci NOT NULL,
    `name` varchar(255) COLLATE latin1_spanish_ci DEFAULT NULL,
    `type` varchar(255) COLLATE latin1_spanish_ci NOT NULL,
    `awsAccountId` varchar(30) COLLATE latin1_spanish_ci NOT NULL,
    `region` varchar(30) COLLATE latin1_spanish_ci NOT NULL,
    `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` datetime NOT NULL DEFAULT(now()),
    PRIMARY KEY (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 203 DEFAULT CHARSET = latin1 COLLATE = latin1_spanish_ci;

  CREATE TABLE
  `awsQuickSightAssets` (
    `id` int NOT NULL AUTO_INCREMENT,
    `assetId` varchar(255) COLLATE latin1_spanish_ci NOT NULL,
    `name` varchar(255) COLLATE latin1_spanish_ci DEFAULT NULL,
    `type` varchar(255) COLLATE latin1_spanish_ci NOT NULL,
    `awsAccountId` varchar(30) COLLATE latin1_spanish_ci NOT NULL,
    `region` varchar(30) COLLATE latin1_spanish_ci NOT NULL,
    `dbId` varchar(255) COLLATE latin1_spanish_ci DEFAULT NULL,
    `tag` varchar(30) COLLATE latin1_spanish_ci DEFAULT '(ALL)',
    `clientId` varchar(45) COLLATE latin1_spanish_ci DEFAULT NULL,
    `ingestionId` varchar(36) COLLATE latin1_spanish_ci DEFAULT NULL,
    `status` varchar(20) COLLATE latin1_spanish_ci DEFAULT NULL,
    `statusDesc` varchar(100) COLLATE latin1_spanish_ci DEFAULT NULL,
    `ingestionSizeInBytes` int DEFAULT NULL,
    `ingestionTimeInSeconds` int DEFAULT NULL,
    `rowsDropped` int DEFAULT NULL,
    `rowsIngested` int DEFAULT NULL,
    `totalRowsInDataset` int DEFAULT NULL,
    `createdTime` datetime DEFAULT NULL,
    `idApiLogs` int DEFAULT NULL,
    `importMode` varchar(20) COLLATE latin1_spanish_ci DEFAULT 'SPICE',
    PRIMARY KEY (`assetId`, `type`, `awsAccountId`, `region`),
    UNIQUE KEY `id` (`id`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 277 DEFAULT CHARSET = latin1 COLLATE = latin1_spanish_ci
