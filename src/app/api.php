<?php


// Cargamos la clase base.
require_once 'report.php';

// Extendemos la clase base.
class api extends report {

	// Constructor.
	public function __construct($db = null) {
		// Llamada en cascada a los constructores de las clases base.
		parent::__construct($db);
	}

	//  Init app
	// ---------------------------------------------------------------------------------------------

	public function ini_app() { require_once 'entities/init/ini_app.php'; }
	public function ini_app_taxista() { require_once 'entities/init/ini_app_taxista.php'; }
}

