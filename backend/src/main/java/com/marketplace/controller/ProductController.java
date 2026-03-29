package com.marketplace.controller;

import com.marketplace.dto.ApiMessageResponse;
import com.marketplace.dto.ProductRequest;
import com.marketplace.dto.ProductResponse;
import com.marketplace.service.ProductService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/products")
    public List<ProductResponse> getProducts(@RequestParam(required = false) String search) {
        return productService.listProducts(search);
    }

    @GetMapping("/products/{id}")
    public ProductResponse getProduct(@PathVariable Long id) {
        return productService.getById(id);
    }

    @GetMapping("/my-listings/{sellerId}")
    public List<ProductResponse> getMyListings(
        @PathVariable Long sellerId,
        @RequestHeader(value = "X-User-Id", required = false) Long requesterId
    ) {
        if (requesterId == null || !requesterId.equals(sellerId)) {
            throw new IllegalArgumentException("Unauthorized: You can only view your own listings");
        }
        return productService.getBySeller(sellerId);
    }

    @PostMapping("/products")
    public ProductResponse createProduct(
        @Valid @RequestBody ProductRequest request,
        @RequestHeader(value = "X-User-Id", required = false) Long requesterId
    ) {
        return productService.create(request, requesterId);
    }

    @PutMapping("/products/{id}")
    public ProductResponse updateProduct(
        @PathVariable Long id,
        @Valid @RequestBody ProductRequest request,
        @RequestHeader(value = "X-User-Id", required = false) Long requesterId
    ) {
        return productService.update(id, request, requesterId);
    }

    @DeleteMapping("/products/{id}")
    public ApiMessageResponse deleteProduct(
        @PathVariable Long id,
        @RequestHeader(value = "X-User-Id", required = false) Long requesterId
    ) {
        productService.delete(id, requesterId);
        return new ApiMessageResponse("Product deleted successfully");
    }
}
