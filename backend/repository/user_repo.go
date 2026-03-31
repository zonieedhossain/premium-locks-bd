package repository

import (
	"fmt"

	"premium-locks-bd/models"
	"premium-locks-bd/storage"
)

// UserRepository defines storage operations for users.
type UserRepository interface {
	GetAll() ([]models.User, error)
	GetByID(id string) (*models.User, error)
	GetByEmail(email string) (*models.User, error)
	Save(u models.User) error
	Update(u models.User) error
	Delete(id string) error
}

type jsonUserRepo struct {
	store *storage.JSONStore[models.User]
}

// NewUserRepository returns a JSON-backed UserRepository.
func NewUserRepository(storageDir string) UserRepository {
	return &jsonUserRepo{
		store: storage.NewJSONStore[models.User](storageDir + "/users.json"),
	}
}

func (r *jsonUserRepo) GetAll() ([]models.User, error) {
	return r.store.Read()
}

func (r *jsonUserRepo) GetByID(id string) (*models.User, error) {
	users, err := r.store.Read()
	if err != nil {
		return nil, err
	}
	for i := range users {
		if users[i].ID == id {
			return &users[i], nil
		}
	}
	return nil, fmt.Errorf("user not found: %s", id)
}

func (r *jsonUserRepo) GetByEmail(email string) (*models.User, error) {
	users, err := r.store.Read()
	if err != nil {
		return nil, err
	}
	for i := range users {
		if users[i].Email == email {
			return &users[i], nil
		}
	}
	return nil, fmt.Errorf("user not found: %s", email)
}

func (r *jsonUserRepo) Save(u models.User) error {
	users, err := r.store.Read()
	if err != nil {
		return err
	}
	users = append(users, u)
	return r.store.Write(users)
}

func (r *jsonUserRepo) Update(u models.User) error {
	users, err := r.store.Read()
	if err != nil {
		return err
	}
	for i := range users {
		if users[i].ID == u.ID {
			users[i] = u
			return r.store.Write(users)
		}
	}
	return fmt.Errorf("user not found: %s", u.ID)
}

func (r *jsonUserRepo) Delete(id string) error {
	users, err := r.store.Read()
	if err != nil {
		return err
	}
	idx := -1
	for i, u := range users {
		if u.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("user not found: %s", id)
	}
	users = append(users[:idx], users[idx+1:]...)
	return r.store.Write(users)
}
