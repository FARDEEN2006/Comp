package com.marketplace.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProductResponse {

    private Long id;
    private Long sellerId;
    private String sellerName;
    private String sellerPhone;
    private String title;
    private String description;
    private BigDecimal price;
    private String condition;
    private String imageUrl;
    private LocalDateTime createdAt;

    public ProductResponse(Long id, Long sellerId, String sellerName, String sellerPhone, String title,
                           String description, BigDecimal price, String condition, String imageUrl,
                           LocalDateTime createdAt) {
        this.id = id;
        this.sellerId = sellerId;
        this.sellerName = sellerName;
        this.sellerPhone = sellerPhone;
        this.title = title;
        this.description = description;
        this.price = price;
        this.condition = condition;
        this.imageUrl = imageUrl;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getSellerId() {
        return sellerId;
    }

    public String getSellerName() {
        return sellerName;
    }

    public String getSellerPhone() {
        return sellerPhone;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getCondition() {
        return condition;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
