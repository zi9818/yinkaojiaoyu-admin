export const CLOUDBASE_AUTH_APP_ID = '';
export const ADMIN_ALLOWLIST_COLLECTION = 'admin_allowlist';

function getUidFromLoginState(loginState) {
  const u = loginState?.user;
  if (!u) return null;
  return u.uid || u.userId || u.id || u._id || u.uuid || null;
}

function getLoginNameCandidatesFromLoginState(loginState) {
  const u = loginState?.user;
  if (!u) {
    return {
      username: null,
      phone: null,
      email: null
    };
  }

  const username = u.username || u.userName || u.name || u.nickName || u.nickname || null;
  const phone = u.phoneNumber || u.phone_number || u.phone || u.mobile || u.mobileNumber || null;
  const email = u.email || u.mail || null;

  return {
    username,
    phone,
    email
  };
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
  const {
    username,
    phone,
    email
  } = getLoginNameCandidatesFromLoginState(loginState);

  try {
    const db = tcb.database();
    let res = null;
    if (uid) {
      res = await db
        .collection(ADMIN_ALLOWLIST_COLLECTION)
        .where({ uid, isActive: true })
        .limit(1)
        .get();
    }

    const hasData = r => Array.isArray(r?.data) && r.data.length > 0;
    if (!hasData(res) && username) {
      res = await db
        .collection(ADMIN_ALLOWLIST_COLLECTION)
        .where({ loginName: String(username), isActive: true })
        .limit(1)
        .get();
    }
    if (!hasData(res) && phone) {
      res = await db
        .collection(ADMIN_ALLOWLIST_COLLECTION)
        .where({ loginName: String(phone), isActive: true })
        .limit(1)
        .get();
    }
    if (!hasData(res) && email) {
      res = await db
        .collection(ADMIN_ALLOWLIST_COLLECTION)
        .where({ loginName: String(email), isActive: true })
        .limit(1)
        .get();
    }

    const ok = hasData(res);

    if (ok && uid) {
      const doc = res.data[0];
      if (doc && !doc.uid && doc._id) {
        try {
          await db
            .collection(ADMIN_ALLOWLIST_COLLECTION)
            .doc(doc._id)
            .update({
              data: {
                uid
              }
            });
        } catch (e) {}
      }
    }

    return {
      status: ok ? 'ok' : 'forbidden',
      tcb,
      auth,
      uid: uid || null
    };
  } catch (e) {
    return {
      status: 'forbidden',
      tcb,
      auth,
      uid: uid || null
    };
  }
}
