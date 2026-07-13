const test = require('node:test');
const assert = require('node:assert/strict');
const { mapPaymentStatus } = require('../src/pesapal');

test('maps completed Pesapal status to paid', () => {
  assert.equal(mapPaymentStatus({ payment_status_description: 'Completed' }), 'paid');
  assert.equal(mapPaymentStatus({ status_code: 1 }), 'paid');
});

test('maps failed and reversed statuses', () => {
  assert.equal(mapPaymentStatus({ payment_status_description: 'Failed' }), 'failed');
  assert.equal(mapPaymentStatus({ payment_status_description: 'Reversed' }), 'reversed');
});

test('keeps unknown and pending statuses pending', () => {
  assert.equal(mapPaymentStatus({ payment_status_description: 'Pending' }), 'pending');
  assert.equal(mapPaymentStatus({}), 'pending');
});
