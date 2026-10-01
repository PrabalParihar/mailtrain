export type Role='Owner'|'Admin'|'Editor'|'Viewer'|'Billing';
export type Action='read'|'edit'|'audience'|'approve'|'send'|'manage'|'billing'|'delete';
const rights:Record<Role,Action[]>={Owner:['read','edit','audience','approve','send','manage','billing','delete'],Admin:['read','edit','audience','approve','send','manage'],Editor:['read','edit'],Viewer:['read'],Billing:['billing']};
export function allowed(role:Role,action:Action){return rights[role]?.includes(action)??false;}
