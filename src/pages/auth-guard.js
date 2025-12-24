export const CLOUDBASE_AUTH_APP_ID = '';
export const ADMIN_ALLOWLIST_COLLECTION = 'admin_allowlist';

function getUidFromLoginState(loginState) {
  const u = loginState?.user;
  if (!u) return null;
  return u.uid || u.userId || u.id || u._id || u.uuid || null;
}

export async function ensureAdminAccess($w) {
  const tcb = await $w?.cloud?.getCloudInstance?.();
  if (!tcb) {
    throw new Error('无法获取云开发实例');
  }

  const auth = tcb?.auth?.();
  if (!auth) {
    throw new Error('当前环境未启用身份认证');
  }

  const loginState = (await auth?.getLoginState?.()) ?? auth?.hasLoginState?.() ?? null;

  if (!loginState) {
    if (!auth?.toDefaultLoginPage) {
      throw new Error('当前环境不支持托管登录页跳转，请确认 CloudBase SDK 版本');
    }
    if (!CLOUDBASE_AUTH_APP_ID) {
      throw new Error('未配置身份认证 app_id（形如 app-xxx）');
    }

    await auth.toDefaultLoginPage({
      config_version: 'env',
      app_id: CLOUDBASE_AUTH_APP_ID,
      redirect_uri: typeof window !== 'undefined' ? window.location.href : ''
    });

    return {
      status: 'redirected',
      tcb,
      auth,
      uid: null
    };
  }

  const uid = getUidFromLoginState(loginState);
  if (!uid) {
    return {
      status: 'forbidden',
      tcb,
      auth,
      uid: null
    };
  }

  try {
    const db = tcb.database();
    const res = await db
      .collection(ADMIN_ALLOWLIST_COLLECTION)
      .where({ uid, isActive: true })
      .limit(1)
      .get();

    const ok = Array.isArray(res?.data) && res.data.length > 0;

    return {
      status: ok ? 'ok' : 'forbidden',
      tcb,
      auth,
      uid
    };
  } catch (e) {
    return {
      status: 'forbidden',
      tcb,
      auth,
      uid
    };
  }
}
