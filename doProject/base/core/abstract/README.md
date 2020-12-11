# Capa Abstracta

La capa abstracta ofrece una base sobre la que construir aplicaciones con acceso a datos.

Está constituida por una seria de plantillas de código que se combinan con esquemas de metadatos para facilitar la implementación de componentes y servicios.

- Componente para listados
- Componente para fichas de detalle
- Componente para búsquedas
- Servicio para el modelo de datos
- Esquemas del modelo de datos


<br />

# Estructura metadática

Normalmente, las entidades de datos se definen como un conjunto de propiedades estáticas durante el tiempo de desarrollo. Sin embargo, puede interesarnos que otra parte de esta estructura se termine de configurar durante el tiempo de ejecución permitiendo así adapatar mejor la aplicación a las necesidades reales del cliente/usuario.

Veamos en un ejemplo como se podría dotar a la aplicación de la posibilidad de definir unos campos adicionales propios para cada cliente que permitan garantizar la trazabilidad de todos sus productos. Por ejemplo, un cliente puede requerir dos campos adicionales para codificar cada uno de sus productos: 
referencia del producto y fecha de envasado.

```typescript
const cliente = {
  idreg: 11,
  ...
  trazabilidad: 'referencia|fecha_envasado', // Definición de dos campos metadáticos.
};

// Durante la edición se despliega una propiedad por cada campo metadático.
const articulo = {
  idreg: 101,
  idcliente: 11,
  ...
  meta_referencia: '123', // Valor del campo metadático desplegado
  meta_fecha_envasado: '17-06-2019', // Valor del campo metadático desplegado
};

// Antes de guardar se repliegan todos los valores metadáticos y se eliminan sus propiedades.
const articulo = {
  idreg: 101,
  idcliente: 11,
  ...
  trazabilidad: '123|17-06-2019', // Valores de los campos metadáticos.
};
```

Veamos un ejemplo de como se produce el despliegue de las propiedades metadáticas en el formulario del artículo:
```html
<form [formGroup]="articulo">
  <!-- Iteramos las propiedades metadáticas -->
  <ion-item *ngFor="let prop of propsTrazabilidad">
    <!-- Creamos un control para la edición de cada una de ellas -->
    <ion-input *ngIf="articulo?.value.hasOwnProperty(prop)"
      [placeholder]="prop?.replace('meta_', '')"
      [formControlName]="prop">
    </ion-input>
  </ion-item>
</form>
```

```typescript
export class ArticuloComponent {

  articulo: FormGroup;

  // Desplegamos las propiedades metadáticas para su edición.
  get propsTrazabilidad(): any {
    return this.cliente.trazabilidad  // Tomamos la definición metadática...
      .split('|')             // Separamos los campos.
      .filter(s => s.trim())  // Filtramos los nombres vacíos.
      .map(s => 'meta_' + s)  // Añadimos el prefijo 'meta_' para evitar concurrencias con el resto de nombres de la entidad.
    ;
  }

  ngOnInit() {
    // Añadimos dinámicamente al formulario los controles metadáticos correspondientes.
    this.propsTrazabilidad.map(prop => this.articulo.addControl(prop, new FormControl()));
  }

  // Antes de enviar la fila al backend, replegamos los valores metadáticos.
  saving(row: any): any {
    // Guardamos los valores metadáticos concatenados.
    row.trazabilidad = [...this.propsTrazabilidad.map(prop => row[prop])].join('|');
    // Eliminamos las propiedades metadáticas que habíamos desplegado dinámicamente.
    this.propsTrazabilidad.map(prop => delete row[prop]);
    // Enviamos la fila a la base de datos.
    return row;
  };
}
```

<br />

# Estructura metadática compleja

En una estructura metadática compleja las propiedades metadáticas se expresan como un object literal, permitiendo indicar información
adicional para el campo además de su nombre, como por ejemplo el tipo de datos, si el valor es requerido, una descripción para elplaceholder, 
un valor por defecto, etc.

```typescript
{
  name: 'fecha_envasado',
  tipo: 'datetime',
  required: true,
  defaultValue: (host: any) => moment().format('YYYY-MM-DD HH:mmZ'),
}
```

```typescript

export type MetaType = 'string' | 'number' | 'boolean' | 'datetime' | 'enum' | 'datapath';

export abstract class MetaControl {
  name: string;
  type: MetaType;
  required: boolean;
  placeholder: string;
  defualtValue: any;
  validators: any[] | (host: any) => any[];
}

/*
 *  <ion-input *ngIf="(atributo.type === 'text' || atributo.type === 'number' || atributo.type === 'tel') && !atributo.uppercase" 
 *    [formControlName]="atributo.ref"
 *    [attr.required]="atributo.requerido"
 *    type="{{atributo.type === 'tel' ? 'tel' : atributo.type === 'number' ? 'number' : 'text'}}" 
 *    placeholder="{{atributo.placeholder}}{{atributo.requerido ? ' *' : ''}}"
 *    autocorrect="off"
 *    autocapitalize="on"
 *    maxlength="{{atributo.type === 'tel' ? 14 : 255}}"
 *  ></ion-input>
 */
export class MetaInput extends MetaControl {
  maxLength: integer;
  autocorrect: 'on' | 'off';
  autocapitalize: 'on' | 'off';
  uppercase: boolean;
}

/**
 *  <ion-datetime class="mydatetime" *ngIf="atributo.type === 'date'" 
 *    [formControlName]="atributo.ref"
 *    value="{{atributo.valor}}"
 *    display-format="DD MMM YYYY"
 *    [monthShortNames]="app.getShortMonthNames()"
 *    placeholder="{{atributo.placeholder}}{{atributo.requerido ? ' *' : ''}}"
 *    cancelText="{{'buttons.cancel' | translate}}" doneText="{{'buttons.accept' | translate}}"
 *  ></ion-datetime>
 */
export class MetaDateTime extends MetaControl {
  displayFormat: string;
  monthShortNames: string[];
  cancelText: string;
  doneText: string;
}

/** 
 *  <ion-select *ngIf="atributo.type === 'enum' || atributo.type === 'datapath'"
 *    block="end"
 *    [formControlName]="atributo.ref"
 *    [required]="atributo.requerido"
 *    placeholder="{{atributo.placeholder}}{{atributo.requerido ? ' *' : ''}}"
 *    [interfaceOptions]="{header: atributo.placeholder}"
 *    cancelText="{{'buttons.cancel' | translate}}" okText="{{'buttons.accept' | translate}}"
 *  >
 *    <ion-select-option *ngFor="let item of atributo.values" [value]="item.valor">{{item.descripcion}}</ion-select-option>
 *  </ion-select>
 */
export class MetaSelect extends MetaControl {
  cancelText: string;
  okText: string;
  values: any[] | (host: any) => any[]
  itemValuePropertyName: string;
  itemDisplayPropertyName: string;
}

```