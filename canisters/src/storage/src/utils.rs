use candid::{Principal};

use crate::env::{ADMIN, MANAGER};

pub fn principal_not_equal(x : Principal, y : Principal) -> bool {
    x != y
}

pub fn is_admin(caller: Principal) -> bool {
    has_privilege(caller, ADMIN.to_vec())
}

pub fn is_manager(caller: Principal) -> bool {
    has_privilege(caller, MANAGER.to_vec())
}

fn has_privilege(caller: Principal, privileges: Vec<&str>) -> bool {
    fn to_principal(entry: &str) -> Principal {
        Principal::from_text(entry).unwrap()
    }

    let principals: Vec<Principal> = privileges.into_iter().map(to_principal).collect();

    let admin: Option<Principal> = principals.into_iter().find(|admin| admin.clone() == caller);

    match admin {
        None => false,
        Some(_admin) => true
    }
}