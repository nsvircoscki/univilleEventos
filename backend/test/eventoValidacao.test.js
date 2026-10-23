import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarSolicitacao } from '../src/services/eventoService.js';
const futuro = Date.now() + 86400000;
const base = () => ({ titulo: 'Encontro', local: ' Auditório   A ', inicio: new Date(futuro).toISOString(), fim: new Date(futuro + 3600000).toISOString() });
test('normaliza espaços e impede campos administrativos fornecidos pelo solicitante', () => {
  const evento = validarSolicitacao({ ...base(), status: 'APROVADO', solicitanteId: 'outro' });
  assert.equal(evento.localChave, 'auditorio a');
  assert.equal(evento.status, undefined);
  assert.equal(evento.solicitanteId, undefined);
});
test('recusa horários invertidos, datas inválidas, datas passadas e campos inválidos', () => {
  for (const dados of [{ fim: base().inicio }, { inicio: 'inválido' }, { inicio: '2000-01-01T12:00:00Z' }, { titulo: '' }, { local: {} }, { titulo: 'a'.repeat(121) }]) {
    assert.throws(() => validarSolicitacao({ ...base(), ...dados }));
  }
});
