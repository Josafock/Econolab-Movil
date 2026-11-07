/** Allow-list for this edition. Never enables a second catalogue or a remote mode. */
export function schoolPathAllowed(path: string) {
  const route = path.split('?')[0];
  return [
    /^\/auth\/(login|refresh|logout|mobile\/logout)$/,
    /^\/users\/(me|update-password)$/,
    /^\/account$/,
    /^\/school\/(workspace|catalog|activities|cuts|privacy\/notice|privacy\/preferences)$/,
    /^\/school\/(catalog|activities)\/[1-9]\d*$/,
  ].some(pattern => pattern.test(route));
}
