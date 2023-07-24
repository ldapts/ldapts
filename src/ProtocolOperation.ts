export const ProtocolOperation = {
  // Misc
  LDAP_VERSION_3: 0x03 as const,
  LBER_SET: 0x31 as const,
  LDAP_CONTROLS: 0xa0 as const,

  // Requests
  LDAP_REQ_BIND: 0x60 as const,
  LDAP_REQ_BIND_SASL: 0xa3 as const,
  LDAP_REQ_UNBIND: 0x42 as const,
  LDAP_REQ_SEARCH: 0x63 as const,
  LDAP_REQ_MODIFY: 0x66 as const,
  LDAP_REQ_ADD: 0x68 as const,
  LDAP_REQ_DELETE: 0x4a as const,
  LDAP_REQ_MODRDN: 0x6c as const,
  LDAP_REQ_COMPARE: 0x6e as const,
  LDAP_REQ_ABANDON: 0x50 as const,
  LDAP_REQ_EXTENSION: 0x77 as const,

  // Responses
  LDAP_RES_BIND: 0x61 as const,
  LDAP_RES_SEARCH_ENTRY: 0x64 as const,
  LDAP_RES_SEARCH_REF: 0x73 as const,
  LDAP_RES_SEARCH: 0x65 as const,
  LDAP_RES_MODIFY: 0x67 as const,
  LDAP_RES_ADD: 0x69 as const,
  LDAP_RES_DELETE: 0x6b as const,
  LDAP_RES_MODRDN: 0x6d as const,
  LDAP_RES_COMPARE: 0x6f as const,
  LDAP_RES_EXTENSION: 0x78 as const,
};

export type ProtocolOperationValues = (typeof ProtocolOperation)[keyof typeof ProtocolOperation];
