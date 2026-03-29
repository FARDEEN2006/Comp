package com.marketplace.repository;

import com.marketplace.entity.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByTitleContainingIgnoreCaseOrConditionContainingIgnoreCaseOrderByCreatedAtDesc(String title, String condition);
    List<Product> findBySellerIdOrderByCreatedAtDesc(Long sellerId);
    List<Product> findAllByOrderByCreatedAtDesc();
}
