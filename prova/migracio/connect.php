<?php


class MyPDO extends PDO {
  public function __construct($dsn, $username, $password, $options) { parent::__construct($dsn, $username, $password, $options); }
  protected $transactionCounter = 0;
  function beginTransaction() { if (!$this->transactionCounter++) return parent::beginTransaction(); else return true; }
  function commit() { if (!--$this->transactionCounter) { $this->adjustCounter(); return parent::commit(); } else { $this->adjustCounter(); return $this->transactionCounter > 0; } }
  function rollback() { if (!--$this->transactionCounter) { $this->adjustCounter(); return parent::rollback(); } else { $this->adjustCounter(); return $this->transactionCounter > 0; } }
  function adjustCounter() { if ($this->transactionCounter < 0) $this->transactionCounter = 0; }
}


/**
* This class extends native PDO one but allow nested transactions
* by using the SQL statements `SAVEPOINT', 'RELEASE SAVEPOINT' AND 'ROLLBACK SAVEPOINT'
*/
class ExtendedPdo extends PDO {

/**
 * @var array Database drivers that support SAVEPOINT * statements.
 */
protected static $_supportedDrivers = array("pgsql", "mysql");

/**
 * @var int the current transaction depth
 */
protected $_transactionDepth = 0;


/**
 * Test if database driver support savepoints
 *
 * @return bool
 */
public function hasSavepoint()
{
  return in_array($this->getAttribute(PDO::ATTR_DRIVER_NAME),
    self::$_supportedDrivers);
}


/**
 * Start transaction
 *
 * @return bool|void
 */
public function beginTransaction()
{
  if ($this->_transactionDepth == 0 || !$this->hasSavepoint()) {
    parent::beginTransaction();
  } else {
    $this->exec("SAVEPOINT LEVEL{$this->_transactionDepth}");
    // $this->exec("SAVEPOINT ".$this->_transactionDepth);
  }

  $this->_transactionDepth++;
}

/**
 * Commit current transaction
 *
 * @return bool|void
 */
public function commit()
{
  $this->_transactionDepth--;

  if ($this->_transactionDepth == 0 || !$this->hasSavepoint()) {
    parent::commit();
  } else {
    $this->exec("RELEASE SAVEPOINT LEVEL{$this->_transactionDepth}");
    // $this->exec("RELEASE SAVEPOINT ".$this->_transactionDepth);
  }
}

/**
 * Rollback current transaction,
 *
 * @throws PDOException if there is no transaction started
 * @return bool|void
 */
public function rollBack()
{

  if ($this->_transactionDepth == 0) {
    throw new PDOException('Rollback error : There is no transaction started');
  }

  $this->_transactionDepth--;

  if ($this->_transactionDepth == 0 || !$this->hasSavepoint()) {
    parent::rollBack();
  } else {
    $this->exec("ROLLBACK TO SAVEPOINT LEVEL{$this->_transactionDepth}");
    // $this->exec("ROLLBACK TO SAVEPOINT ".$this->_transactionDepth);
  }
}
}


try {

  // Credenciales para la base de datos.
  $hostname_conn = "mysql-5703.dinaserver.com";
  $database_conn = "pre_test_db";
  $username_conn = "pre_test_user";
  $password_conn = "1NTdK75F";
  $charset_conn = "utf8"; 
  $persist_conn = false; 
  // Preparamos una conexión con la base de datos.
  $pdo = new MyPDO("mysql:host=".$hostname_conn.";dbname=".$database_conn.";charset=".$charset_conn.";", $username_conn, $password_conn, array(
      PDO::ATTR_EMULATE_PREPARES => false,            // Deshabilita la emulación que viene habilitada por defecto en el driver de MySQL.
      // PDO::ATTR_STRINGIFY_FETCHES => false,           // En teoría, evita la conversión de tipos string que podrían ser números a tipos numéricos.
      PDO::ATTR_TIMEOUT => 120,   // Timeout connection in seconds
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,    // Lanza una excepción en caso de error.
      PDO::ATTR_PERSISTENT => $persist_conn           // false -> la conexión se cierra automáticamente cuando se termina de ejecutar el script.
  ));
} catch(Exception $ex) {
  // Database error: connection failed!
  echo $ex->getMessage();
}