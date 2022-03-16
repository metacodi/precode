<?php
  include "connect.php";

  $migra = 
    [
      "base" => [
        [
          "desc" => "Language",
          "table" => "lang",
          "script" => "lang.sql"
        ],
        [
          "desc" => "Blobs",
          "table" => "blobs",
          "script" => "blobs.sql"
        ]
      ],
    "exteses" => [
      [
        "desc" => "Ubicacions",
        "table" => "ubicaciones",
        "script" => ["misdireciones.sql","ubicaciones.php"]
      ],
      [
        "desc" => "Usuaris",
        "table" => "usuarios",
        "script" => ["usuarios.sql","users.php?import=usuarios","clear.php?table=usuarios"]
      ],
      [
        "desc" => "Taxistes",
        "table" => "taxistas",
        "script" => ["taxistas.sql","users.php?import=taxistas","clear.php?table=taxistas"]
      ]
    ]
  ];
  
  $check_base = [];

  if(!empty($_POST['check_base'])) {
      foreach($_POST['check_base'] as $check) {
        $check_base[] = $check; 
      }
  }

  $check_exteses = [];

  if(!empty($_POST['check_exteses'])) {
      foreach($_POST['check_exteses'] as $check) {
        $check_exteses[] = $check; 
      }
  }
  
  ?>

  <script type="text/javascript">
  
  var migra = <?php echo json_encode($migra, JSON_PRETTY_PRINT) ?>;
  var checkBase = <?php echo json_encode($check_base, JSON_PRETTY_PRINT) ?>;
  var checkExteses = <?php echo json_encode($check_exteses, JSON_PRETTY_PRINT) ?>;

  function init(){
    migra.base.forEach(addBase);
    migra.exteses.forEach(addExteses);
  }
  function isChecked(list, value) {
    for(var i=0;i<list.length;i++){
      if (value === list[i]){
        return 'checked';
      }
    }
    return '';
  }
 
  function addBase(item, index) {  document.getElementById("base").innerHTML += '<tr><td><input type="checkbox" name="check_base[]" value="' + item.table + '" ' + isChecked(checkBase,item.table) + '></td><td>' + item.desc + '</td></tr>'; }
  function addExteses(item, index) {  document.getElementById("exteses").innerHTML += '<tr><td><input type="checkbox" name="check_exteses[]" value="' + item.table + '" ' + isChecked(checkExteses,item.table) + '></td><td>' + item.desc + '</td></tr>'; }
  </script>

<html>
  <head></head>
  <body>
  
    <h1>Migració:</h1>
    <form action="index.php" method="post">
      <table style="width:100%; padding: 20px;">
        <tr>
          <th>Base</th>
          <th>Exteses</th>
        </tr>
        <tr>
          <td>
            <table id="base" style="width:50%">
            </table>
          </td>
          <td>
            <table id="exteses" style="width:50%">
            </table>
          </td>
        </tr>
      </table>
      <input type="submit" />
    </form>
  </body>
  <script type="text/javascript">
    init();
  </script>
</html>