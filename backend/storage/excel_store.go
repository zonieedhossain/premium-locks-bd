package storage

import (
	"fmt"
	"os"
	"strconv"
	"sync"

	"github.com/xuri/excelize/v2"
	"premium-locks-bd/models"
)

const (
	sheetName = "Products"
	dataDir   = "./data"
	excelFile = "./data/products.xlsx"
)

var headers = []string{
	"ID", "Name", "Description", "Price", "Category", "Stock", "ImageURL", "CreatedAt", "UpdatedAt",
}

// ExcelStore handles persistent storage of products in an Excel file.
type ExcelStore struct {
	mu sync.RWMutex
}

// NewExcelStore creates a new ExcelStore and ensures the Excel file exists.
func NewExcelStore() (*ExcelStore, error) {
	s := &ExcelStore{}
	if err := s.ensureFile(); err != nil {
		return nil, fmt.Errorf("excel store init: %w", err)
	}
	return s, nil
}

func (s *ExcelStore) ensureFile() error {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return fmt.Errorf("create data dir: %w", err)
	}

	if _, err := os.Stat(excelFile); !os.IsNotExist(err) {
		return nil // file already exists
	}

	f := excelize.NewFile()
	defer f.Close()

	f.SetSheetName("Sheet1", sheetName)
	for col, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(col+1, 1)
		f.SetCellValue(sheetName, cell, h)
	}

	return f.SaveAs(excelFile)
}

// GetAll returns all products from the Excel file.
func (s *ExcelStore) GetAll() ([]models.Product, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	f, err := excelize.OpenFile(excelFile)
	if err != nil {
		return nil, fmt.Errorf("open excel: %w", err)
	}
	defer f.Close()

	rows, err := f.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("get rows: %w", err)
	}

	products := make([]models.Product, 0, len(rows))
	for i, row := range rows {
		if i == 0 {
			continue // skip header
		}
		p, err := rowToProduct(row)
		if err != nil {
			continue // skip malformed rows
		}
		products = append(products, p)
	}

	return products, nil
}

// GetByID returns a single product by ID.
func (s *ExcelStore) GetByID(id string) (*models.Product, error) {
	products, err := s.GetAll()
	if err != nil {
		return nil, err
	}
	for _, p := range products {
		if p.ID == id {
			cp := p
			return &cp, nil
		}
	}
	return nil, fmt.Errorf("product not found: %s", id)
}

// Save appends a new product to the Excel file.
func (s *ExcelStore) Save(p models.Product) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	f, err := excelize.OpenFile(excelFile)
	if err != nil {
		return fmt.Errorf("open excel: %w", err)
	}
	defer f.Close()

	rows, err := f.GetRows(sheetName)
	if err != nil {
		return fmt.Errorf("get rows: %w", err)
	}

	nextRow := len(rows) + 1
	return s.writeRow(f, nextRow, p)
}

// Update finds the product row by ID and overwrites it.
func (s *ExcelStore) Update(p models.Product) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	f, err := excelize.OpenFile(excelFile)
	if err != nil {
		return fmt.Errorf("open excel: %w", err)
	}
	defer f.Close()

	rows, err := f.GetRows(sheetName)
	if err != nil {
		return fmt.Errorf("get rows: %w", err)
	}

	for i, row := range rows {
		if i == 0 || len(row) == 0 {
			continue
		}
		if row[0] == p.ID {
			return s.writeRow(f, i+1, p)
		}
	}

	return fmt.Errorf("product not found: %s", p.ID)
}

// Delete removes a product row by ID and rewrites the file.
func (s *ExcelStore) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	f, err := excelize.OpenFile(excelFile)
	if err != nil {
		return fmt.Errorf("open excel: %w", err)
	}
	defer f.Close()

	rows, err := f.GetRows(sheetName)
	if err != nil {
		return fmt.Errorf("get rows: %w", err)
	}

	// Find row index (1-based)
	rowIdx := -1
	for i, row := range rows {
		if i == 0 || len(row) == 0 {
			continue
		}
		if row[0] == id {
			rowIdx = i + 1
			break
		}
	}

	if rowIdx == -1 {
		return fmt.Errorf("product not found: %s", id)
	}

	if err := f.RemoveRow(sheetName, rowIdx); err != nil {
		return fmt.Errorf("remove row: %w", err)
	}

	return f.Save()
}

// writeRow writes a product to a specific row index (1-based) and saves the file.
func (s *ExcelStore) writeRow(f *excelize.File, rowIdx int, p models.Product) error {
	values := []interface{}{
		p.ID, p.Name, p.Description,
		p.Price, p.Category, p.Stock,
		p.ImageURL, p.CreatedAt, p.UpdatedAt,
	}
	for col, v := range values {
		cell, _ := excelize.CoordinatesToCellName(col+1, rowIdx)
		f.SetCellValue(sheetName, cell, v)
	}
	return f.Save()
}

// rowToProduct parses an Excel row slice into a Product.
func rowToProduct(row []string) (models.Product, error) {
	// Pad row to minimum length
	for len(row) < 9 {
		row = append(row, "")
	}

	price, err := strconv.ParseFloat(row[3], 64)
	if err != nil {
		price = 0
	}
	stock, err := strconv.Atoi(row[5])
	if err != nil {
		stock = 0
	}

	return models.Product{
		ID:          row[0],
		Name:        row[1],
		Description: row[2],
		Price:       price,
		Category:    row[4],
		Stock:       stock,
		ImageURL:    row[6],
		CreatedAt:   row[7],
		UpdatedAt:   row[8],
	}, nil
}
