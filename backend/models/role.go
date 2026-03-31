package models

type Role string

const (
	RoleSuperAdmin Role = "superadmin"
	RoleAdmin      Role = "admin"
	RoleEditor     Role = "editor"
	RoleViewer     Role = "viewer"
)

// DefaultPermissions maps each role to its default permission set.
var DefaultPermissions = map[Role][]string{
	RoleSuperAdmin: {"products:read", "products:write", "users:read", "users:write"},
	RoleAdmin:      {"products:read", "products:write", "users:read"},
	RoleEditor:     {"products:read", "products:write"},
	RoleViewer:     {"products:read"},
}

// ValidRole returns true if the role string is a known role.
func ValidRole(r string) bool {
	switch Role(r) {
	case RoleSuperAdmin, RoleAdmin, RoleEditor, RoleViewer:
		return true
	}
	return false
}
