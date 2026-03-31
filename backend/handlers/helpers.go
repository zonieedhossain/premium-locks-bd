package handlers

import (
	"github.com/gin-gonic/gin"
	"premium-locks-bd/middleware"
	"premium-locks-bd/services"
)

func getClaimsFromCtx(c *gin.Context) *services.Claims {
	raw, _ := c.Get(middleware.ClaimsKey)
	claims, _ := raw.(*services.Claims)
	if claims == nil {
		return &services.Claims{}
	}
	return claims
}
