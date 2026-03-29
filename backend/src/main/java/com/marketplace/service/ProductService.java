package com.marketplace.service;

import com.marketplace.dto.ProductRequest;
import com.marketplace.dto.ProductResponse;
import com.marketplace.entity.Product;
import com.marketplace.entity.User;
import com.marketplace.exception.NotFoundException;
import com.marketplace.repository.ProductRepository;
import com.marketplace.repository.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ProductService(ProductRepository productRepository, UserRepository userRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    public List<ProductResponse> listProducts(String search) {
        List<Product> products;
        if (search == null || search.isBlank()) {
            products = productRepository.findAllByOrderByCreatedAtDesc();
        } else {
            products = productRepository
                .findByTitleContainingIgnoreCaseOrConditionContainingIgnoreCaseOrderByCreatedAtDesc(search, search);
        }
        return products.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ProductResponse getById(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Product not found"));
        return toResponse(product);
    }

    public List<ProductResponse> getBySeller(Long sellerId) {
        return productRepository.findBySellerIdOrderByCreatedAtDesc(sellerId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public ProductResponse create(ProductRequest request, Long requesterId) {
        if (requesterId == null) {
            throw new IllegalArgumentException("Unauthorized: Login required");
        }
        if (request.getSellerId() == null || !requesterId.equals(request.getSellerId())) {
            throw new IllegalArgumentException("Unauthorized: You can only create listings for your own account");
        }

        User seller = userRepository.findById(requesterId)
            .orElseThrow(() -> new NotFoundException("Seller not found"));

        Product product = new Product();
        product.setSeller(seller);
        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCondition(request.getCondition());
        product.setImageUrl(request.getImageUrl());

        return toResponse(productRepository.save(product));
    }

    public ProductResponse update(Long id, ProductRequest request, Long requesterId) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Product not found"));

        if (requesterId == null || product.getSeller() == null || product.getSeller().getId() == null) {
            throw new IllegalArgumentException("Unauthorized: Login required");
        }
        if (!requesterId.equals(product.getSeller().getId())) {
            throw new IllegalArgumentException("Unauthorized: You can only edit your own products");
        }
        product.setTitle(request.getTitle());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCondition(request.getCondition());
        product.setImageUrl(request.getImageUrl());

        return toResponse(productRepository.save(product));
    }

    public void delete(Long id, Long requesterId) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Product not found"));

        if (requesterId == null || product.getSeller() == null || product.getSeller().getId() == null) {
            throw new IllegalArgumentException("Unauthorized: Login required");
        }
        if (!requesterId.equals(product.getSeller().getId())) {
            throw new IllegalArgumentException("Unauthorized: You can only delete your own products");
        }

        productRepository.delete(product);
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
            product.getId(),
            product.getSeller().getId(),
            product.getSeller().getName(),
            product.getSeller().getPhone(),
            product.getTitle(),
            product.getDescription(),
            product.getPrice(),
            product.getCondition(),
            product.getImageUrl(),
            product.getCreatedAt()
        );
    }
}
