package models

type User struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Email        string   `json:"email"`
	PasswordHash string   `json:"password_hash"`
	Role         string   `json:"role"`
	Permissions  []string `json:"permissions"`
	IsActive     bool     `json:"is_active"`
	CreatedAt    string   `json:"created_at"`
	CreatedBy    string   `json:"created_by"`
	RefreshToken string   `json:"refresh_token,omitempty"`
}

// SafeUser omits sensitive fields for API responses.
type SafeUser struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Email       string   `json:"email"`
	Role        string   `json:"role"`
	Permissions []string `json:"permissions"`
	IsActive    bool     `json:"is_active"`
	CreatedAt   string   `json:"created_at"`
	CreatedBy   string   `json:"created_by"`
}

func (u *User) Safe() SafeUser {
	return SafeUser{
		ID:          u.ID,
		Name:        u.Name,
		Email:       u.Email,
		Role:        u.Role,
		Permissions: u.Permissions,
		IsActive:    u.IsActive,
		CreatedAt:   u.CreatedAt,
		CreatedBy:   u.CreatedBy,
	}
}
