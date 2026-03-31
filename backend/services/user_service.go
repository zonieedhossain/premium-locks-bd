package services

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"premium-locks-bd/models"
	"premium-locks-bd/repository"
)

// UserService handles user management logic.
type UserService struct {
	userRepo repository.UserRepository
}

// NewUserService creates a new UserService.
func NewUserService(userRepo repository.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

// GetAll returns all users as SafeUser slices.
func (s *UserService) GetAll() ([]models.SafeUser, error) {
	users, err := s.userRepo.GetAll()
	if err != nil {
		return nil, err
	}
	result := make([]models.SafeUser, len(users))
	for i, u := range users {
		result[i] = u.Safe()
	}
	return result, nil
}

// GetByID returns a user without sensitive fields.
func (s *UserService) GetByID(id string) (*models.SafeUser, error) {
	u, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	safe := u.Safe()
	return &safe, nil
}

// UserInput carries fields for create/update.
type UserInput struct {
	Name        string
	Email       string
	Password    string // plaintext — hashed before storing
	Role        string
	Permissions []string
}

// Create hashes the password and saves a new user.
func (s *UserService) Create(input UserInput, createdBy string, creatorRole string) (*models.SafeUser, error) {
	if err := validateUserInput(input, true); err != nil {
		return nil, err
	}
	if !models.ValidRole(input.Role) {
		return nil, fmt.Errorf("invalid role: %s", input.Role)
	}
	// Role hierarchy: superadmin can assign any role; admin cannot create superadmin/admin
	if creatorRole == string(models.RoleAdmin) && (input.Role == string(models.RoleSuperAdmin) || input.Role == string(models.RoleAdmin)) {
		return nil, fmt.Errorf("admins cannot create %s accounts", input.Role)
	}

	if _, err := s.userRepo.GetByEmail(input.Email); err == nil {
		return nil, fmt.Errorf("email already registered")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	perms := input.Permissions
	if len(perms) == 0 {
		perms = models.DefaultPermissions[models.Role(input.Role)]
	}

	u := models.User{
		ID:           uuid.NewString(),
		Name:         input.Name,
		Email:        strings.ToLower(input.Email),
		PasswordHash: string(hash),
		Role:         input.Role,
		Permissions:  perms,
		IsActive:     true,
		CreatedAt:    time.Now().UTC().Format(time.RFC3339),
		CreatedBy:    createdBy,
	}

	if err := s.userRepo.Save(u); err != nil {
		return nil, fmt.Errorf("save user: %w", err)
	}
	safe := u.Safe()
	return &safe, nil
}

// Update modifies a user's info, role, or permissions.
func (s *UserService) Update(id string, input UserInput, updaterRole string) (*models.SafeUser, error) {
	existing, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if err := validateUserInput(input, input.Password != ""); err != nil {
		return nil, err
	}
	if input.Role != "" && !models.ValidRole(input.Role) {
		return nil, fmt.Errorf("invalid role: %s", input.Role)
	}
	if updaterRole == string(models.RoleAdmin) && input.Role == string(models.RoleSuperAdmin) {
		return nil, fmt.Errorf("admins cannot promote to superadmin")
	}

	if input.Name != "" {
		existing.Name = input.Name
	}
	if input.Email != "" {
		existing.Email = strings.ToLower(input.Email)
	}
	if input.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
		if err != nil {
			return nil, fmt.Errorf("hash password: %w", err)
		}
		existing.PasswordHash = string(hash)
	}
	if input.Role != "" {
		existing.Role = input.Role
	}
	if len(input.Permissions) > 0 {
		existing.Permissions = input.Permissions
	}

	if err := s.userRepo.Update(*existing); err != nil {
		return nil, err
	}
	safe := existing.Safe()
	return &safe, nil
}

// ToggleActive flips the IsActive flag.
func (s *UserService) ToggleActive(id string) (*models.SafeUser, error) {
	u, err := s.userRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	u.IsActive = !u.IsActive
	if err := s.userRepo.Update(*u); err != nil {
		return nil, err
	}
	safe := u.Safe()
	return &safe, nil
}

// Delete removes a user.
func (s *UserService) Delete(id string) error {
	return s.userRepo.Delete(id)
}

// SeedSuperAdmin creates the default superadmin if no users exist.
func (s *UserService) SeedSuperAdmin() error {
	users, err := s.userRepo.GetAll()
	if err != nil {
		return err
	}
	if len(users) > 0 {
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), 12)
	if err != nil {
		return err
	}

	admin := models.User{
		ID:           uuid.NewString(),
		Name:         "Super Admin",
		Email:        "admin@admin.com",
		PasswordHash: string(hash),
		Role:         string(models.RoleSuperAdmin),
		Permissions:  models.DefaultPermissions[models.RoleSuperAdmin],
		IsActive:     true,
		CreatedAt:    time.Now().UTC().Format(time.RFC3339),
		CreatedBy:    "system",
	}
	return s.userRepo.Save(admin)
}

func validateUserInput(input UserInput, requirePassword bool) error {
	if strings.TrimSpace(input.Name) == "" {
		return fmt.Errorf("name is required")
	}
	if strings.TrimSpace(input.Email) == "" {
		return fmt.Errorf("email is required")
	}
	if requirePassword && len(input.Password) < 6 {
		return fmt.Errorf("password must be at least 6 characters")
	}
	return nil
}
