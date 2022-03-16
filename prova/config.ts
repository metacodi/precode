
export const AppConfig = {

  name: 'kk',

  app: {
    name: /^3/g,
    package: 'com.exceltaxisantcugat.user',
    id: 1,
  },
  // blobs/paymentsSettings.json
  gateways: {
    foo: 'bar',
    // visa
    10: true,
    // mastercard
    11: true,
    // amex
    12: true,
    // redsys
    20: true,
    // paypal
    30: false,
    // bizum
    31: false,
    // stripe
    32: false,
    bar: 'fee',
  },

}
