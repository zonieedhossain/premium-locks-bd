package services

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/line"
	"github.com/johnfercher/maroto/v2/pkg/components/row"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/props"
	"premium-locks-bd/models"
	"premium-locks-bd/repository"
	"premium-locks-bd/storage"
)

type InvoiceConfig struct {
	CompanyName    string
	CompanyAddress string
	CompanyPhone   string
	CompanyEmail   string
	TaxPercentage  float64
	InvoiceDir     string
}

type InvoiceService struct {
	invoiceRepo  repository.InvoiceRepository
	saleRepo     repository.SaleRepository
	purchaseRepo repository.PurchaseRepository
	counterStore *storage.CounterStore
	cfg          InvoiceConfig
}

func NewInvoiceService(
	invoiceRepo repository.InvoiceRepository,
	saleRepo repository.SaleRepository,
	purchaseRepo repository.PurchaseRepository,
	counterStore *storage.CounterStore,
	cfg InvoiceConfig,
) *InvoiceService {
	return &InvoiceService{
		invoiceRepo:  invoiceRepo,
		saleRepo:     saleRepo,
		purchaseRepo: purchaseRepo,
		counterStore: counterStore,
		cfg:          cfg,
	}
}

func (s *InvoiceService) GetAll() ([]models.Invoice, error) {
	return s.invoiceRepo.GetAll()
}

func (s *InvoiceService) GetByID(id string) (*models.Invoice, error) {
	return s.invoiceRepo.GetByID(id)
}

func (s *InvoiceService) GenerateForSale(saleID string) (*models.Invoice, error) {
	sale, err := s.saleRepo.GetByID(saleID)
	if err != nil {
		return nil, err
	}

	if err := os.MkdirAll(s.cfg.InvoiceDir, 0o755); err != nil {
		return nil, fmt.Errorf("create invoice dir: %w", err)
	}

	filename := fmt.Sprintf("sale_%s_%s.pdf", saleID[:8], time.Now().Format("20060102150405"))
	filePath := filepath.Join(s.cfg.InvoiceDir, filename)

	if err := s.buildSalePDF(sale, filePath); err != nil {
		return nil, fmt.Errorf("build PDF: %w", err)
	}

	// Check if invoice already exists for this sale
	all, _ := s.invoiceRepo.GetAll()
	for _, inv := range all {
		if inv.LinkedID == saleID && inv.Type == "sale" {
			inv.FilePath = filePath
			inv.CreatedAt = time.Now().UTC().Format(time.RFC3339)
			_ = s.invoiceRepo.Update(inv)
			return &inv, nil
		}
	}

	inv := models.Invoice{
		ID:            uuid.NewString(),
		InvoiceNumber: sale.InvoiceNumber,
		Type:          "sale",
		LinkedID:      saleID,
		FilePath:      filePath,
		CreatedAt:     time.Now().UTC().Format(time.RFC3339),
	}
	if err := s.invoiceRepo.Save(inv); err != nil {
		return nil, err
	}
	return &inv, nil
}

func (s *InvoiceService) GenerateForPurchase(purchaseID string) (*models.Invoice, error) {
	purchase, err := s.purchaseRepo.GetByID(purchaseID)
	if err != nil {
		return nil, err
	}

	if err := os.MkdirAll(s.cfg.InvoiceDir, 0o755); err != nil {
		return nil, fmt.Errorf("create invoice dir: %w", err)
	}

	n, err := s.counterStore.Next("purchase_invoice")
	if err != nil {
		return nil, err
	}
	invoiceNum := fmt.Sprintf("INV-PUR-%04d", n)
	filename := fmt.Sprintf("purchase_%s_%s.pdf", purchaseID[:8], time.Now().Format("20060102150405"))
	filePath := filepath.Join(s.cfg.InvoiceDir, filename)

	if err := s.buildPurchasePDF(purchase, invoiceNum, filePath); err != nil {
		return nil, fmt.Errorf("build PDF: %w", err)
	}

	// Check if invoice already exists
	all, _ := s.invoiceRepo.GetAll()
	for _, inv := range all {
		if inv.LinkedID == purchaseID && inv.Type == "purchase" {
			inv.FilePath = filePath
			inv.InvoiceNumber = invoiceNum
			inv.CreatedAt = time.Now().UTC().Format(time.RFC3339)
			_ = s.invoiceRepo.Update(inv)
			return &inv, nil
		}
	}

	inv := models.Invoice{
		ID:            uuid.NewString(),
		InvoiceNumber: invoiceNum,
		Type:          "purchase",
		LinkedID:      purchaseID,
		FilePath:      filePath,
		CreatedAt:     time.Now().UTC().Format(time.RFC3339),
	}
	if err := s.invoiceRepo.Save(inv); err != nil {
		return nil, err
	}
	return &inv, nil
}

func (s *InvoiceService) buildSalePDF(sale *models.Sale, filePath string) error {
	cfg := config.NewBuilder().Build()
	mrt := maroto.New(cfg)

	// Header
	mrt.AddRows(
		row.New(15).Add(
			text.NewCol(12, s.cfg.CompanyName, props.Text{Size: 16, Style: fontstyle.Bold, Align: align.Center}),
		),
		row.New(6).Add(
			text.NewCol(12, s.cfg.CompanyAddress, props.Text{Size: 9, Align: align.Center}),
		),
		row.New(6).Add(
			text.NewCol(6, "Phone: "+s.cfg.CompanyPhone, props.Text{Size: 9}),
			text.NewCol(6, "Email: "+s.cfg.CompanyEmail, props.Text{Size: 9, Align: align.Right}),
		),
	)

	mrt.AddRow(4, line.NewCol(12))

	// Invoice info
	mrt.AddRows(
		row.New(8).Add(
			text.NewCol(6, "SALES INVOICE", props.Text{Size: 14, Style: fontstyle.Bold}),
			text.NewCol(6, sale.InvoiceNumber, props.Text{Size: 14, Style: fontstyle.Bold, Align: align.Right}),
		),
		row.New(6).Add(
			text.NewCol(6, "Date: "+time.Now().Format("02 Jan 2006"), props.Text{Size: 9}),
			text.NewCol(6, "Status: "+sale.Status, props.Text{Size: 9, Align: align.Right}),
		),
	)

	mrt.AddRow(4, line.NewCol(12))

	// Customer info
	mrt.AddRows(
		row.New(6).Add(text.NewCol(12, "BILL TO", props.Text{Size: 10, Style: fontstyle.Bold})),
		row.New(6).Add(text.NewCol(12, sale.CustomerName, props.Text{Size: 9})),
	)
	if sale.CustomerEmail != "" {
		mrt.AddRow(5, text.NewCol(12, "Email: "+sale.CustomerEmail, props.Text{Size: 9}))
	}
	if sale.CustomerPhone != "" {
		mrt.AddRow(5, text.NewCol(12, "Phone: "+sale.CustomerPhone, props.Text{Size: 9}))
	}
	if sale.CustomerAddress != "" {
		mrt.AddRow(5, text.NewCol(12, "Address: "+sale.CustomerAddress, props.Text{Size: 9}))
	}

	mrt.AddRow(4, line.NewCol(12))

	// Table header
	mrt.AddRow(8,
		text.NewCol(4, "Product", props.Text{Size: 9, Style: fontstyle.Bold}),
		text.NewCol(2, "SKU", props.Text{Size: 9, Style: fontstyle.Bold}),
		text.NewCol(1, "Qty", props.Text{Size: 9, Style: fontstyle.Bold, Align: align.Center}),
		text.NewCol(2, "Unit Price", props.Text{Size: 9, Style: fontstyle.Bold, Align: align.Right}),
		text.NewCol(1, "Discount", props.Text{Size: 9, Style: fontstyle.Bold, Align: align.Right}),
		text.NewCol(2, "Subtotal", props.Text{Size: 9, Style: fontstyle.Bold, Align: align.Right}),
	)

	mrt.AddRow(2, line.NewCol(12))

	// Items
	for _, item := range sale.Items {
		mrt.AddRow(7,
			text.NewCol(4, item.ProductName, props.Text{Size: 8}),
			text.NewCol(2, item.SKU, props.Text{Size: 8}),
			text.NewCol(1, fmt.Sprintf("%d", item.Quantity), props.Text{Size: 8, Align: align.Center}),
			text.NewCol(2, fmt.Sprintf("%.2f", item.UnitPrice), props.Text{Size: 8, Align: align.Right}),
			text.NewCol(1, fmt.Sprintf("%.2f", item.Discount), props.Text{Size: 8, Align: align.Right}),
			text.NewCol(2, fmt.Sprintf("%.2f", item.Subtotal), props.Text{Size: 8, Align: align.Right}),
		)
	}

	mrt.AddRow(2, line.NewCol(12))

	// Totals
	mrt.AddRows(
		row.New(6).Add(
			col.New(8),
			text.NewCol(2, "Sub Total:", props.Text{Size: 9}),
			text.NewCol(2, fmt.Sprintf("%.2f", sale.SubTotal), props.Text{Size: 9, Align: align.Right}),
		),
		row.New(6).Add(
			col.New(8),
			text.NewCol(2, "Discount:", props.Text{Size: 9}),
			text.NewCol(2, fmt.Sprintf("%.2f", sale.DiscountAmount), props.Text{Size: 9, Align: align.Right}),
		),
		row.New(6).Add(
			col.New(8),
			text.NewCol(2, fmt.Sprintf("Tax (%.0f%%):", s.cfg.TaxPercentage), props.Text{Size: 9}),
			text.NewCol(2, fmt.Sprintf("%.2f", sale.TaxAmount), props.Text{Size: 9, Align: align.Right}),
		),
		row.New(8).Add(
			col.New(8),
			text.NewCol(2, "TOTAL:", props.Text{Size: 11, Style: fontstyle.Bold}),
			text.NewCol(2, fmt.Sprintf("%.2f", sale.TotalAmount), props.Text{Size: 11, Style: fontstyle.Bold, Align: align.Right}),
		),
	)

	if sale.PaymentMethod != "" {
		mrt.AddRow(6, text.NewCol(12, "Payment Method: "+sale.PaymentMethod, props.Text{Size: 9}))
	}

	mrt.AddRow(4, line.NewCol(12))
	mrt.AddRow(6, text.NewCol(12, "Thank you for your business!", props.Text{Size: 9, Align: align.Center}))

	doc, err := mrt.Generate()
	if err != nil {
		return err
	}
	return doc.Save(filePath)
}

func (s *InvoiceService) buildPurchasePDF(purchase *models.Purchase, invoiceNum, filePath string) error {
	cfg := config.NewBuilder().Build()
	mrt := maroto.New(cfg)

	mrt.AddRows(
		row.New(15).Add(
			text.NewCol(12, s.cfg.CompanyName, props.Text{Size: 16, Style: fontstyle.Bold, Align: align.Center}),
		),
		row.New(6).Add(
			text.NewCol(12, s.cfg.CompanyAddress, props.Text{Size: 9, Align: align.Center}),
		),
	)

	mrt.AddRow(4, line.NewCol(12))

	mrt.AddRows(
		row.New(8).Add(
			text.NewCol(6, "PURCHASE ORDER", props.Text{Size: 14, Style: fontstyle.Bold}),
			text.NewCol(6, invoiceNum, props.Text{Size: 14, Style: fontstyle.Bold, Align: align.Right}),
		),
		row.New(6).Add(
			text.NewCol(6, "Date: "+time.Now().Format("02 Jan 2006"), props.Text{Size: 9}),
			text.NewCol(6, "Status: "+purchase.Status, props.Text{Size: 9, Align: align.Right}),
		),
		row.New(6).Add(
			text.NewCol(12, "Supplier: "+purchase.SupplierName, props.Text{Size: 9}),
		),
	)

	mrt.AddRow(4, line.NewCol(12))

	mrt.AddRow(8,
		text.NewCol(4, "Product", props.Text{Size: 9, Style: fontstyle.Bold}),
		text.NewCol(2, "SKU", props.Text{Size: 9, Style: fontstyle.Bold}),
		text.NewCol(2, "Qty", props.Text{Size: 9, Style: fontstyle.Bold, Align: align.Center}),
		text.NewCol(2, "Unit Cost", props.Text{Size: 9, Style: fontstyle.Bold, Align: align.Right}),
		text.NewCol(2, "Subtotal", props.Text{Size: 9, Style: fontstyle.Bold, Align: align.Right}),
	)

	mrt.AddRow(2, line.NewCol(12))

	for _, item := range purchase.Items {
		mrt.AddRow(7,
			text.NewCol(4, item.ProductName, props.Text{Size: 8}),
			text.NewCol(2, item.SKU, props.Text{Size: 8}),
			text.NewCol(2, fmt.Sprintf("%d", item.Quantity), props.Text{Size: 8, Align: align.Center}),
			text.NewCol(2, fmt.Sprintf("%.2f", item.UnitCost), props.Text{Size: 8, Align: align.Right}),
			text.NewCol(2, fmt.Sprintf("%.2f", item.Subtotal), props.Text{Size: 8, Align: align.Right}),
		)
	}

	mrt.AddRow(2, line.NewCol(12))

	mrt.AddRows(
		row.New(8).Add(
			col.New(8),
			text.NewCol(2, "TOTAL:", props.Text{Size: 11, Style: fontstyle.Bold}),
			text.NewCol(2, fmt.Sprintf("%.2f", purchase.TotalAmount), props.Text{Size: 11, Style: fontstyle.Bold, Align: align.Right}),
		),
		row.New(6).Add(
			col.New(8),
			text.NewCol(2, "Paid:", props.Text{Size: 9}),
			text.NewCol(2, fmt.Sprintf("%.2f", purchase.PaidAmount), props.Text{Size: 9, Align: align.Right}),
		),
	)

	mrt.AddRow(4, line.NewCol(12))
	mrt.AddRow(6, text.NewCol(12, "Thank you for your business!", props.Text{Size: 9, Align: align.Center}))

	doc, err := mrt.Generate()
	if err != nil {
		return err
	}
	return doc.Save(filePath)
}
