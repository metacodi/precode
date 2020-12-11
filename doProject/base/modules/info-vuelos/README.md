# Info-vuelo

Mòdul que connecta amb la API de `FlyStats` per obtenir informació sobre un vol determinat.

## Install

`app.module.ts`
```typescript
import { InfoVuelosModule } from 'src/modules/info-vuelos/info-vuelos.module';

@NgModule({
  imports: [
    InfoVuelosModule,
  ]
})
export class AppModule {}
```

## Usage

`sample.page.ts`
```typescript
import { InfoVuelosService } from 'src/modules/info-vuelos/info-vuelos.service';

export class SamplePage() {

  constructor() {
    public infoVuelo: InfoVuelosService,
  }

  async getInfoVuelo(step: string): Promise<any> {
    const direccion = step === 'recogida' ? 'arr' : 'dep';
    const vuelo = 'AA1234';
    const fecha = moment(this.row.recogida).format('YYYY-MM-DD');
  
    return this.infoVuelo.navigate(direccion, vuelo, fecha, this);
  }
}
```