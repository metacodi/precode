
export const AppConfig = {

  name: 'kk',
  
  app: {
    name: /^3/g,
    regex: true,
    nulo: null,
    text: 'text',
    package: 'com.exceltaxisantcugat.user',
    id: 1,
    arr: ['foo', 21],
    obj: { foo: 'bar', regex: /(g|i)/, arr: [{ do: /^4/i }] },
  },
  // blobs/paymentsSettings.json
  gateways: {
    foo: ['foo', 21],
    // visa
    10: { foo: 'bar', regex: {  }, arr: [{ do: {  } }] },
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
