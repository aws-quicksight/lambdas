DROP PROCEDURE IF EXISTS `sp_AlterTable`;
DELIMITER $$
CREATE PROCEDURE `sp_AlterTable`(Tabla varchar(255), Campo varchar(255), Tipo varchar(255), AceptaNull varchar(255), DefaultValue varchar(255))
BEGIN
  SET NAMES latin1; SET character_set_client = 'latin1'; SET collation_connection = 'latin1_spanish_ci';

  SET SQL_SAFE_UPDATES = 0;

  IF Tipo LIKE 'INTEGER%' THEN
    SET Tipo = 'INT';
  ELSEIF Tipo LIKE 'INT64%' THEN
    SET Tipo = 'DOUBLE';
  ELSEIF Tipo LIKE 'DOUBLE%' THEN 
    SET Tipo = 'DOUBLE';
  ELSEIF Tipo LIKE 'ENUM%' THEN 
    SET Tipo = 'VARCHAR(100)';
  ELSEIF Tipo LIKE 'DECIMAL%' THEN
    SET Tipo = 'DECIMAL(19,4)';
  ELSEIF Tipo LIKE 'SMALLINT%' THEN
    SET Tipo = 'INT';
  ELSEIF Tipo LIKE 'DATETIME%' THEN
    SET Tipo = 'DATETIME';
  ELSEIF Tipo LIKE 'DATE%' THEN
    SET Tipo = 'DATE';
  ELSEIF Tipo LIKE 'TIMESTAMP%' THEN
    SET Tipo = 'DATETIME';
  ELSEIF Tipo LIKE 'BOOLEAN%' THEN
    SET Tipo = 'TINYINT(1)';
  ELSEIF Tipo LIKE 'BIT%' THEN
    SET Tipo = 'TINYINT(1)';
  ELSEIF Tipo LIKE 'TEXT(-1)%' THEN
    SET Tipo = 'TEXT';
  ELSEIF Tipo LIKE 'IMAGE%' THEN
    SET Tipo = 'BLOB';
  END IF;

  IF (IFNULL(NULLIF(AceptaNull, 'undefined'), '') = '') THEN
    SET AceptaNull = 'NULL';
  END IF;

  IF (AceptaNull = 'true') THEN
    SET  AceptaNull = 'NULL';
  END IF;

  IF (AceptaNull = 'false') THEN
    SET  AceptaNull = 'NOT NULL';
  END IF;

  IF DefaultValue = 'getdate' THEN
    SET DefaultValue = '';
  END IF;

  IF(Tipo LIKE 'tinyint%') THEN
    IF EXISTS(SELECT NULL
                FROM INFORMATION_SCHEMA.COLUMNS
               WHERE table_name = Tabla
                 AND table_schema = DATABASE()
                 AND data_type = 'varchar'
                 AND column_name = REPLACE(Campo, '`', '')) THEN

      SET @update_sql = CONCAT('UPDATE ',Tabla,' SET `', Campo, '`= 0 WHERE `', Campo, '` NOT LIKE \'F%\' AND `', Campo, '` NOT LIKE \'T%\' AND `', Campo, '` NOT IN(\'0\', \'1\');');
      PREPARE stmt FROM @update_sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;

      SET @update_sql = CONCAT('UPDATE `',Tabla,'` SET `', Campo, '`= 0 WHERE `', Campo, '` LIKE \'F%\';');
      PREPARE stmt FROM @update_sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;

      SET @update_sql = CONCAT('UPDATE `',Tabla,'` SET `', Campo, '`= 1 WHERE `', Campo, '` LIKE \'T%\';');
      PREPARE stmt FROM @update_sql;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;

      SET @alter_column = CONCAT('ALTER TABLE `',Tabla, '` CHANGE COLUMN `', Campo, '` `', Campo, '` ', Tipo, ' ;') ;
      PREPARE stmt FROM @alter_column;
      EXECUTE stmt;
      DEALLOCATE PREPARE stmt;

    END IF;
  END IF;

  IF NOT EXISTS(SELECT NULL
                  FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE table_name = Tabla
                   AND table_schema = DATABASE()
                   AND column_name = REPLACE(Campo, '`', '')) THEN

    IF (IFNULL(NULLIF(DefaultValue, 'undefined'), '') <> '') THEN
      SET @alter_sql = CONCAT('ALTER TABLE `',Tabla,'` ADD `', Campo, '` ', Tipo, ' ', AceptaNull, ' DEFAULT ', '\'', DefaultValue, '\'');
    ELSE
      SET @alter_sql = CONCAT('ALTER TABLE `',Tabla,'` ADD `', Campo, '` ', Tipo, ' ', AceptaNull);
    END IF;

    PREPARE stmt FROM @alter_sql;
    EXECUTE stmt;

    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

DROP TABLE IF EXISTS `apiLogs`;
CREATE TABLE IF NOT EXISTS `apiLogs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `formName` varchar(2000) NOT NULL DEFAULT '',
  `formType` varchar(45),
  `source` varchar(45),
  `class` varchar(45),
  `documentId` char(36),
  `timezone` varchar(100),
  `browser` varchar(100),
  `ip` varchar(45),
  `userId` varchar(45),
  `action` varchar(200),
  `method` json,
  `jDoc` json,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  KEY `documentId` (`documentId`),
  KEY `action` (`action`)
) DEFAULT CHARSET=latin1 COLLATE=latin1_spanish_ci;

DROP TABLE IF EXISTS awsQuickSightAssets;
CREATE TABLE IF NOT EXISTS awsQuickSightAssets (
  id INT NOT NULL AUTO_INCREMENT,
  assetId VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NULL,
  `type` VARCHAR(255) NOT NULL,
  awsAccountId VARCHAR(30) NOT NULL,
  region VARCHAR(30) NOT NULL,
  dbId VARCHAR(255),
  tag VARCHAR(30) DEFAULT '(ALL)',
  clientId VARCHAR(45),
--  serverUuid  VARCHAR(36),
--  licenceID	 VARCHAR(36),
  PRIMARY KEY (id)
) DEFAULT CHARSET=latin1 COLLATE=latin1_spanish_ci;
CALL sp_AlterTable('awsQuickSightAssets', 'ingestionId', 'varchar(36)', 'NULL', '');
CALL sp_AlterTable('awsQuickSightAssets', 'status', 'varchar(20)', 'NULL', '');
CALL sp_AlterTable('awsQuickSightAssets', 'statusDesc', 'varchar(100)', 'NULL', '');
CALL sp_AlterTable('awsQuickSightAssets', 'ingestionSizeInBytes', 'int', 'NULL', '');
CALL sp_AlterTable('awsQuickSightAssets', 'ingestionTimeInSeconds', 'int', 'NULL', '');
CALL sp_AlterTable('awsQuickSightAssets', 'rowsDropped', 'int', 'NULL', '');
CALL sp_AlterTable('awsQuickSightAssets', 'rowsIngested', 'int', 'NULL', '');
CALL sp_AlterTable('awsQuickSightAssets', 'totalRowsInDataset', 'int', 'NULL', '');
CALL sp_AlterTable('awsQuickSightAssets', 'createdTime', 'datetime', 'NULL', '');
CALL sp_AlterTable('awsQuickSightAssets', 'idApiLogs', 'int', 'NULL', '');
CALL sp_AlterTable('awsQuickSightAssets', 'importMode', 'varchar(20)', 'NULL', 'SPICE'); -- DIRECT_QUERY

-- DROP TABLE IF EXISTS logStores;
CREATE TABLE IF NOT EXISTS logStores(
  id  int not null auto_increment unique key,
  obj  varchar(255),
  message  varchar(255),
  fecha  timestamp DEFAULT CURRENT_TIMESTAMP,
  documentId  varchar(36),
  PRIMARY KEY(id)
  ) DEFAULT CHARSET=latin1 COLLATE=latin1_spanish_ci;
CALL sp_dropColumn('logStores', 'payload');
CALL sp_AlterTable('logStores', 'serviceID', 'varchar(36)', 'NULL', '');
CALL sp_AlterTable('logStores', 'syncID', 'int', 'NULL', '');
CALL sp_AlterTable('logStores', 'documentId', 'varchar(36)', 'NULL', '');
CALL sp_AlterTable('logStores', 'assetId', 'varchar(255)', 'NULL', '');
CALL sp_AlterTable('logStores', 'awsAccountId', 'varchar(30)', 'NULL', '');
CALL sp_AlterTable('logStores', 'rid', 'int', 'NULL', '');
-- CALL sp_AlterTable('logStores', 'payload', 'LONGTEXT', 'NULL', '');
CALL sp_createIndex('logStores', 'documentId', 'documentId', '');
CALL sp_createIndex('logStores', 'assetId', 'assetId', '');


DELIMITER $$
#***************** spQuickSightCreateIngestion *****************
DROP PROCEDURE IF EXISTS `spQuickSightCreateIngestion`$$
CREATE PROCEDURE `spQuickSightCreateIngestion`(
  _db  varchar(255),
  _licenceID  varchar(36),
  _serverUuid  varchar(36),
  _syncID  int,
  _tag  varchar(20),
  _specificDataSetId varchar(255)
)
bloque0:BEGIN

  DECLARE _payload   LONGTEXT;
	DECLARE _rid, _id, _prevId  int;
	DECLARE _funcionLambda, _dataSetId, _action  varchar(255);
  DECLARE _ingestionId   varchar(36);
  DECLARE _awsAccountId  varchar(30);

	SET NAMES latin1;	SET character_set_client = 'latin1'; SET collation_connection = 'latin1_spanish_ci';

  SELECT valor INTO _funcionLambda FROM cfgParametros WHERE param = 'lambdaQuickSightCreateIngestion';
  SET _action = 'create';

  SET _prevId = 0,
      _rid = NULL;

  table_id: WHILE(1=1) DO
    SELECT MIN(id)
      INTO _rid
      FROM vwAwsQuickSightDataSets
     WHERE id > _prevId
       AND db = _db
       AND licenceID = _licenceID
       AND serverUuid = _serverUuid
       AND assetId = IFNULL(NULLIF(_specificDataSetId,''),assetId)
       AND tag = IFNULL(NULLIF(NULLIF(_tag,''),'(ALL)'),tag) 
--       AND `type` = 'data-set'
       AND importMode = 'SPICE'; -- DIRECT_QUERY

    IF _rid IS NULL THEN
      IF _prevId = 0 THEN
        INSERT INTO logStores (obj, message, serviceID, documentId, assetId, syncID)
          VALUES ('spQuickSightCreateIngestion', 'No data in vwAwsQuickSightAssets matches the given parameters', _licenceID, _ingestionId, _dataSetId, _syncID);
      END IF;
      LEAVE table_id;
    END IF;

    SET _ingestionId = UUID();

    SELECT assetId, awsAccountId
      INTO _dataSetId, _awsAccountId
      FROM vwAwsQuickSightAssets
     WHERE id = _rid;

    /*
     {
       "serviceId": "3c219307-d46b-11ef-8da3-12c793de1779",
       "dataSetId": "dataset-elcamello-bimodulosgrupo1",
       "ingestionId": "2",
       "action": "create"
     }
    */

    SET _payload = JSON_OBJECT(
      'serviceId', _licenceID,
      'dataSetId', _dataSetId,
      'ingestionId', _ingestionId,
      'action', _action,
      'syncID', _syncID
    );

    -- Call lambda function without returning result
    SELECT lambda_async(_funcionLambda, _payload) INTO @result;

    INSERT INTO logStores (obj,                            message, serviceID,  documentId,     assetId,  syncID,  awsAccountId,  rid )
      VALUES              ('spQuickSightCreateIngestion', _action, _licenceID, _ingestionId, _dataSetId, _syncID, _awsAccountId, _rid );

    UPDATE awsQuickSightAssets 
       SET ingestionId = _ingestionId,
           createdTime = UTC_TIMESTAMP()
     WHERE id = _rid;

    DO SLEEP(5);

    SET _prevId = _rid;
    SET _rid = NULL,
        _ingestionId = NULL,
        _dataSetId = NULL;

  END WHILE;
END$$
DELIMITER ;

DELIMITER $$
#***************** spQuickSightDescribeIngestion *****************
DROP PROCEDURE IF EXISTS `spQuickSightDescribeIngestion`$$
CREATE PROCEDURE `spQuickSightDescribeIngestion`(
  _ingestionId  varchar(36)
)
bloque0:BEGIN

  DECLARE _payload   LONGTEXT;
	DECLARE _rid, _id, _prevId  int;
	DECLARE _funcionLambda, _dataSetId, _action  varchar(255);
	DECLARE _ambiente   varchar(10);
  DECLARE _serviceID  varchar(36);

	SET NAMES latin1;	SET character_set_client = 'latin1'; SET collation_connection = 'latin1_spanish_ci';

  SELECT valor INTO _ambiente FROM cfgParametros WHERE param = 'ambiente';
  SELECT valor INTO _funcionLambda FROM cfgParametros WHERE param = 'lambdaQuickSightCreateIngestion';
  SELECT IFNULL(_ambiente,'DEV') INTO _ambiente;
  SET _action = 'describe';

  SELECT serviceID,    assetId,  rid
    INTO _serviceID, _dataSetId, _rid
    FROM logStores
   WHERE documentId = _ingestionId
     AND obj = 'spQuickSightCreateIngestion'
   ORDER BY id DESC
   LIMIT 1;

  IF _dataSetId IS NULL THEN
    INSERT INTO logStores (obj,                message,                                              documentId,    assetId,  rid)
      VALUES ('spQuickSightDescribeIngestion', 'No data in logStores matches the given parameters', _ingestionId, _dataSetId, _rid);
    LEAVE bloque0;
  END IF;

  /*
    {
      "serviceId": "3c219307-d46b-11ef-8da3-12c793de1779",
      "dataSetId": "dataset-elcamello-bimodulosgrupo1",
      "ingestionId": "2",
      "action": "describe"
    }
  */
  
  SET _payload = JSON_OBJECT(
    'serviceId', _serviceID,
    'dataSetId', _dataSetId,
    'ingestionId', _ingestionId,
    'action', _action
  );

  -- Call lambda function without returning result
  SELECT lambda_async(_funcionLambda, _payload) INTO @result;

  INSERT INTO logStores (obj,                message, serviceID, documentId,      assetId, rid )
    VALUES ('spQuickSightDescribeIngestion', _action, _serviceID, _ingestionId, _dataSetId, _rid );


END$$
DELIMITER ;

DELIMITER $$
#***************** spApiLogs *****************
DROP PROCEDURE IF EXISTS `spApiLogs`$$
CREATE PROCEDURE `spApiLogs`(
	_documentId char(36),
	_action varchar(200)
)
bloque0:BEGIN

	DECLARE _body  LONGTEXT;
	DECLARE _method  JSON;
	DECLARE _syncID, _rid, _idApiLogs, _prevId  int;
	DECLARE _jDoc  JSON;
  DECLARE _ambiente   varchar(10);
  DECLARE _serviceID, _uuidServerProd, _uuidServerActual   varchar(36);
  DECLARE _timezone varchar(64);
  DECLARE _status varchar(50);
  DECLARE _statusDesc varchar(100);
  DECLARE _ingestionId, _licenceID, _serverUuid varchar(36);
  DECLARE _ingestionSizeInBytes, _ingestionTimeInSeconds, _rowsDropped, _rowsIngested, 
          _totalRowsInDataset, _dbId  int;
  DECLARE _tag  varchar(20);
  DECLARE _db, _specificDataSetId, _assetId  varchar(255);
  DECLARE _createdTime, _timestamp  datetime;
  DECLARE _clientId  varchar(45);

	SET NAMES latin1;	SET character_set_client = 'latin1'; SET collation_connection = 'latin1_spanish_ci';

	SELECT valor INTO _ambiente FROM cfgParametros WHERE param = 'ambiente';
	SELECT valor INTO _uuidServerProd FROM cfgParametros WHERE param = 'uuidServerProd';
	SELECT @@server_uuid INTO _uuidServerActual; -- IF _uuidServerProd = _uuidServerActual THEN

	SELECT `timezone` INTO _timezone FROM syncInfo ORDER BY `timestamp` DESC LIMIT 1;
	SELECT IFNULL(NULLIF(TRIM(_timezone),''),'Etc/GMT+6') INTO _timezone;

--	INSERT INTO tmpLog (ref1, ref2) VALUES (_documentId, _action);

	SELECT
	  id,
		`method`,  -- method es la peticion enviada a Lambda
		jDoc, -- es la respuesta de Lambda
    `timestamp`
	INTO
		_idApiLogs,
		_method,
		_jDoc,
    _timestamp
  FROM apiLogs
  WHERE documentId = _documentId;

  IF _action IN ('quicksight-create-ingestion','quicksight-describe-ingestion') THEN
  
    IF _action = 'quicksight-create-ingestion' THEN
      SELECT
        JSON_UNQUOTE(JSON_EXTRACT(_method,'$.ingestionId')),
        JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.Status')),
        JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.IngestionStatus')),
        _timestamp
      INTO
        _ingestionId,
        _status,
        _statusDesc,
        _createdTime;
      
      SELECT rid
        INTO _rid
        FROM logStores
      WHERE documentId = _ingestionId
        AND obj = 'spQuickSightCreateIngestion'
      ORDER BY id DESC 
      LIMIT 1;
    
    ELSE -- quicksight-describe-ingestion
      SELECT
        JSON_UNQUOTE(JSON_EXTRACT(_method,'$.ingestionId')),
        JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.Status')),
        JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.Ingestion.IngestionStatus')),
        JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.Ingestion.IngestionSizeInBytes')),
        JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.Ingestion.IngestionTimeInSeconds')),
        JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.Ingestion.CreatedTime')),
        JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.Ingestion.RowInfo.RowsDropped')),
        JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.Ingestion.RowInfo.RowsIngested')),
        JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.Ingestion.RowInfo.TotalRowsInDataset'))
      INTO
        _ingestionId,
        _status,
        _statusDesc,
        _ingestionSizeInBytes,
        _ingestionTimeInSeconds,
        _createdTime,
        _rowsDropped,
        _rowsIngested,
        _totalRowsInDataset;
      
      SELECT rid
        INTO _rid
        FROM logStores
       WHERE documentId = _ingestionId
         AND obj = 'spQuickSightDescribeIngestion'
       ORDER BY id DESC 
       LIMIT 1;

    END IF;

    UPDATE awsQuickSightAssets
       SET `status` = _status,
           statusDesc = _statusDesc,
           ingestionSizeInBytes = _ingestionSizeInBytes,
           ingestionTimeInSeconds = _ingestionTimeInSeconds,
           createdTime = _createdTime,
           rowsDropped = _rowsDropped,
           rowsIngested = _rowsIngested,
           totalRowsInDataset = _totalRowsInDataset,
           idApiLogs = _idApiLogs
     WHERE id = _rid;

  /* end IF _action IN ('quicksight-create-ingestion','quicksight-describe-ingestion') */
  
  ELSEIF _action = 'requestIngestion' THEN
  
    SELECT
      JSON_UNQUOTE(JSON_EXTRACT(_method,'$.db')),
      JSON_UNQUOTE(JSON_EXTRACT(_method,'$.serviceID')),
      JSON_UNQUOTE(JSON_EXTRACT(_method,'$.serverUuid')),
      JSON_UNQUOTE(JSON_EXTRACT(_method,'$.syncID')),
      JSON_UNQUOTE(JSON_EXTRACT(_method,'$.tag')),
      JSON_UNQUOTE(JSON_EXTRACT(_method,'$.specificDataSetId'))
    INTO
      _db,
      _serviceID,
      _serverUuid,
      _syncID,
      _tag,
      _specificDataSetId;

    call spQuickSightCreateIngestion(_db, _serviceID, _serverUuid, _syncID, _tag, _specificDataSetId);
  
  /* end IF _action = 'requestIngestion' */

  ELSEIF _action = 'quicksight-create-dataset' THEN

    SELECT
      JSON_UNQUOTE(JSON_EXTRACT(_method,'$.serviceId')),
      JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.Status')),
      JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.DataSetId')),
      JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.IngestionId'))
    INTO
      _serviceID,
      _status, 
      _assetId,
      _ingestionId;

    SELECT `timestamp`
      INTO _createdTime
      FROM apiLogs
     WHERE documentId = _documentId
     LIMIT 1;

    SELECT id, clientId
      INTO _dbId, _clientId
      FROM awsDatabases
     WHERE licenceID = _serviceID
     LIMIT 1;

    UPDATE awsQuickSightAssets
       SET `status` = _status,
           ingestionId = _ingestionId,
           idApiLogs = _idApiLogs,
           createdTime = _createdTime,
           `dbId` = _dbId,
           clientId = _clientId
     WHERE assetId = _assetId;

  /* end IF _action = 'quicksight-create-dataset' */

  ELSEIF _action = 'quicksight-delete-dataset' THEN

    SELECT
      JSON_UNQUOTE(JSON_EXTRACT(_method,'$.serviceId')),
      JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.Status')),
      JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.DataSetId'))
    INTO
      _serviceID,
      _status, 
      _assetId;

    SELECT `timestamp`
      INTO _createdTime
      FROM apiLogs
     WHERE documentId = _documentId
     LIMIT 1;

    UPDATE awsQuickSightAssets
       SET `status` = _status,
           idApiLogs = _idApiLogs,
           createdTime = _createdTime
     WHERE assetId = _assetId;

  /* end IF _action = 'quicksight-delete-dataset' */

  ELSEIF _action = 'quicksight-describe-dataset' THEN

    SELECT
      JSON_UNQUOTE(JSON_EXTRACT(_method,'$.serviceId')),
      JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.Status')),
      JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.DataSet.DataSetId'))
    INTO
      _serviceID,
      _status, 
      _assetId;

    SELECT id, clientId
      INTO _dbId, _clientId
      FROM awsDatabases
     WHERE licenceID = _serviceID
     LIMIT 1;

    UPDATE awsQuickSightAssets
       SET `status` = _status,
           idApiLogs = _idApiLogs,
           createdTime = CAST(JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.DataSet.LastUpdatedTime')) AS DATETIME),
           importMode = JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.DataSet.ImportMode')),
           ingestionSizeInBytes = JSON_UNQUOTE(JSON_EXTRACT(_jDoc,'$.DataSet.ConsumedSpiceCapacityInBytes'))
     WHERE assetId = _assetId;

  /* end IF _action = 'quicksight-describe-dataset' */

  END IF;

--	INSERT INTO logStores (obj, message, documentId) VALUES ('spApiLogs', 'ok', _documentId);

END$$
DELIMITER ;