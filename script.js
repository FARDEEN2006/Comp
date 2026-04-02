(function () {
  "use strict";

  var API_BASE = localStorage.getItem("apiBase") || "http://localhost:8080";
  var USER_KEY = "shcm_user";
  var DEFAULT_COUNTRY_CODE = "91";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setError(form, message) {
    var box = qs(".error", form || document);
    if (!box) return;
    box.textContent = message || "";
    box.style.display = message ? "block" : "none";
  }

  function getCurrentUser() {
    try {
      var userData = JSON.parse(localStorage.getItem(USER_KEY) || "null");
      // Validate user has required fields
      if (userData && userData.id && userData.email) {
        return userData;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  function setCurrentUser(user) {
    if (user && user.id) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  function updateCurrentUserPhone(newPhone) {
    var user = getCurrentUser();
    if (user) {
      user.phone = newPhone;
      setCurrentUser(user);
    }
  }

  function clearCurrentUser() {
    localStorage.removeItem(USER_KEY);
  }

  function formatINR(amount) {
    var num = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(num);
  }

  function api(path, options) {
    var opts = options || {};
    var user = getCurrentUser();
    var headers = opts.headers || {};
    // Lightweight auth context: backend uses this to ensure users can only edit/delete their own products.
    if (user && user.id && !headers["X-User-Id"]) {
      headers["X-User-Id"] = String(user.id);
    }
    opts.headers = headers;

    return fetch(API_BASE + path, opts).then(function (res) {
      return res.text().then(function (text) {
        var data = {};
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (e) {
            data = { message: text };
          }
        }
        if (!res.ok) {
          throw new Error(data.message || "Request failed");
        }
        return data;
      });
    });
  }

  function toWhatsAppNumber(phone) {
    var source = String(phone || "").trim();
    if (!source) return "";

    var raw = source.replace(/\D/g, "");
    if (!raw) return "";

    if (source.indexOf("+") === 0) {
      if (/^[1-9]\d{9,14}$/.test(raw)) return raw;
      return "";
    }

    // Local India format support
    if (raw.length === 10) return DEFAULT_COUNTRY_CODE + raw;
    if (raw.length === 11 && raw.charAt(0) === "0") return DEFAULT_COUNTRY_CODE + raw.substring(1);

    // Already includes country code without +
    if (/^[1-9]\d{10,14}$/.test(raw)) return raw;

    return raw;
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(new Error("Could not read image file"));
      };
      reader.readAsDataURL(file);
    });
  }

  function attachPasswordToggles() {
    qsa("button.toggle-password").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetId = btn.getAttribute("data-target");
        var input = targetId ? qs("#" + targetId) : null;
        if (!input) return;
        var isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        btn.textContent = isPassword ? "Hide" : "Show";
      });
    });
  }

  function attachDemoButtons() {
    qsa("[data-demo-click]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        alert(el.getAttribute("data-demo-click") || "Demo action");
      });
    });
  }

  function attachLogout() {
    qsa("a.nav-link").forEach(function (a) {
      if (a.textContent.trim().toLowerCase() === "logout") {
        a.addEventListener("click", function () {
          clearCurrentUser();
        });
      }
    });
  }

  function requireAuthForAppPages() {
    var path = window.location.pathname.toLowerCase();
    var isPublic = path.endsWith("/login.html") || path.endsWith("/login") || 
                   path.endsWith("/register.html") || path.endsWith("/register") || 
                   path === "/";
    if (isPublic) return;

    var user = getCurrentUser();
    if (!user) {
      window.location.href = "login.html";
    }
  }

  function initLogin() {
    var form = qs("#loginForm") || qs("main form");
    var email = qs("#email");
    var pass = qs("#loginPassword");
    if (!form || !email || !pass) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setError(form, "");

      if (!email.value.trim() || !pass.value.trim()) {
        setError(form, "Please fill in all required fields.");
        return;
      }

      api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value.trim(), password: pass.value })
      }).then(function (data) {
        var userData = { id: data.userId, name: data.name, email: data.email };
        setCurrentUser(userData);
        
        // Fetch full user details to get phone number
        return api("/api/users/" + data.userId, { method: "GET" }).then(function (fullUser) {
          userData.phone = fullUser.phone;
          setCurrentUser(userData);
          window.location.href = "home.html";
        }).catch(function () {
          // If fetching full user fails, still proceed to home
          userData.phone = "";
          setCurrentUser(userData);
          window.location.href = "home.html";
        });
      }).catch(function (err) {
        setError(form, err.message);
      });
    });
  }

  function initRegister() {
    var form = qs("#registerForm") || qs("main form");
    var name = qs("#name");
    var phone = qs("#phone");
    var email = qs("#regEmail");
    var pass = qs("#regPassword");
    if (!form || !name || !phone || !email || !pass) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setError(form, "");

      if (!name.value.trim() || !phone.value.trim() || !email.value.trim() || !pass.value.trim()) {
        setError(form, "Please fill in all required fields.");
        return;
      }

      api("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.value.trim(),
          phone: phone.value.trim(),
          email: email.value.trim(),
          password: pass.value
        })
      }).then(function (data) {
        // Store phone during registration
        var newUser = {
          id: data.userId,
          name: name.value.trim(),
          email: email.value.trim(),
          phone: phone.value.trim()
        };
        setCurrentUser(newUser);
        window.location.href = "login.html";
      }).catch(function (err) {
        setError(form, err.message);
      });
    });
  }

  function placeholderImage() {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1'%3E%3Cstop offset='0' stop-color='%25232563eb'/%3E%3Cstop offset='1' stop-color='%252360a5fa'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%2523g)'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='38' fill='white'%3EComponent Image%3C/text%3E%3C/svg%3E";
  }

  function getProductImageUrl(imageUrl) {
    var src = String(imageUrl || "");
    if (src.length > 10) {
      return src; // Trust any actual image URL or data URI provided instead of strictly filtering
    }
    return placeholderImage();
  }

  function renderProductCard(p) {
    var img = getProductImageUrl(p.imageUrl);
    return "" +
      "<a class='card product-card' href='product.html?id=" + p.id + "' data-title='" + escapeHtml(p.title || "") + "' data-condition='" + escapeHtml(p.condition || "") + "'>" +
      "<img class='product-img' alt='" + escapeHtml(p.title || "Product") + "' src='" + img + "' />" +
      "<div class='card-body'>" +
      "<div><strong>" + escapeHtml(p.title || "Untitled") + "</strong></div>" +
      "<div class='product-meta'><span class='price'>" + formatINR(p.price) + "</span><span class='badge'>" + escapeHtml(p.condition || "N/A") + "</span></div>" +
      "</div></a>";
  }

  function initHome() {
    if (window.location.pathname.toLowerCase().indexOf("home") === -1) return;

    var grid = qs("#productsGrid");
    var searchInput = qs("#searchInput");
    var emptyState = qs("#emptyState");
    if (!grid) return;

    var allProducts = [];

    function render(list) {
      grid.innerHTML = list.map(renderProductCard).join("");
      if (emptyState) {
        emptyState.style.display = list.length ? "none" : "block";
      }
    }

    function applySearch() {
      var term = String((searchInput && searchInput.value) || "").toLowerCase().trim();
      if (!term) {
        render(allProducts);
        return;
      }
      var filtered = allProducts.filter(function (p) {
        return String(p.title || "").toLowerCase().indexOf(term) !== -1 ||
          String(p.condition || "").toLowerCase().indexOf(term) !== -1;
      });
      render(filtered);
    }

    api("/api/products", { method: "GET" })
      .then(function (data) {
        allProducts = Array.isArray(data) ? data : [];
        render(allProducts);
      })
      .catch(function () {
        allProducts = [];
        render([]);
      });

    if (searchInput) {
      searchInput.addEventListener("input", applySearch);
    }
  }

  function initProduct() {
    var titleEl = qs("#productTitle");
    var priceEl = qs("#productPrice");
    var conditionEl = qs("#productCondition");
    var descEl = qs("#productDesc");
    var imgEl = qs("#productImg");
    var contactBtn = qs("#contactSellerBtn");
    var buyBtn = qs("#buyNowBtn");
    var phoneEl = qs("#sellerPhone");
    if (!titleEl || !priceEl || !conditionEl || !descEl) return;

    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    if (!id) {
      // If user opens /product without an id, route to the first available listing.
      api("/api/products", { method: "GET" })
        .then(function (list) {
          if (Array.isArray(list) && list.length && list[0].id) {
            var firstId = encodeURIComponent(list[0].id);
            window.location.href = "product?id=" + firstId;
            return;
          }

          if (descEl) descEl.textContent = "No products available. Please add a product first.";
          if (phoneEl) phoneEl.textContent = "Unavailable";
          if (titleEl) titleEl.textContent = "Product Not Found";
          if (conditionEl) conditionEl.textContent = "Condition: N/A";
          if (priceEl) priceEl.textContent = "N/A";
          if (contactBtn) contactBtn.style.display = "none";
          if (buyBtn) buyBtn.style.display = "none";
        })
        .catch(function () {
          if (descEl) descEl.textContent = "Unable to load products. Start backend and refresh.";
          if (phoneEl) phoneEl.textContent = "Unavailable";
          if (titleEl) titleEl.textContent = "Product Not Found";
          if (conditionEl) conditionEl.textContent = "Condition: N/A";
          if (priceEl) priceEl.textContent = "N/A";
          if (contactBtn) contactBtn.style.display = "none";
          if (buyBtn) buyBtn.style.display = "none";
        });
      return;
    }

    api("/api/products/" + encodeURIComponent(id), { method: "GET" })
      .then(function (p) {
        titleEl.textContent = p.title || "Product";
        priceEl.textContent = formatINR(p.price);
        conditionEl.textContent = "Condition: " + (p.condition || "N/A");
        descEl.textContent = p.description || "No description";
        if (imgEl) {
          imgEl.src = getProductImageUrl(p.imageUrl);
          imgEl.alt = p.title || "Product";
        }

        var waPhone = toWhatsAppNumber(p.sellerPhone);
        var message = "Hello " + (p.sellerName || "Seller") + ", I am interested in your product: " + (p.title || "") + " (" + formatINR(p.price) + ").";

        if (phoneEl) {
          phoneEl.textContent = p.sellerPhone || "Not provided";
        }

        if (contactBtn) {
          if (waPhone) {
            var contactUrl = "https://wa.me/" + waPhone + "?text=" + encodeURIComponent(message);
            contactBtn.href = contactUrl;
            contactBtn.onclick = function (e) {
              e.preventDefault();
              window.location.href = contactUrl;
            };
          } else {
            contactBtn.href = "#";
            contactBtn.onclick = function (e) {
              e.preventDefault();
              alert("Seller phone is invalid or missing (" + (p.sellerPhone || "empty") + "). Ask seller to update phone in Settings.");
            };
          }
        }
        if (buyBtn) {
          if (waPhone) {
            var buyUrl = "https://wa.me/" + waPhone + "?text=" + encodeURIComponent("I want to buy: " + (p.title || "") + " for " + formatINR(p.price));
            buyBtn.href = buyUrl;
            buyBtn.onclick = function (e) {
              e.preventDefault();
              window.location.href = buyUrl;
            };
          } else {
            buyBtn.href = "#";
            buyBtn.onclick = function (e) {
              e.preventDefault();
              alert("Seller phone is invalid or missing (" + (p.sellerPhone || "empty") + "). Ask seller to update phone in Settings.");
            };
          }
        }

        document.title = (p.title || "Product") + " • Second-Hand Component Marketplace";
      })
      .catch(function () {
        // If backend is down, make it obvious to the user.
        if (descEl) {
          descEl.textContent = "Unable to load product details. Please start the backend (mvn spring-boot:run) and retry.";
        }
        if (phoneEl) {
          phoneEl.textContent = "Unavailable";
        }
        if (contactBtn) {
          contactBtn.href = "javascript:void(0);";
          contactBtn.onclick = function (e) {
            e.preventDefault();
            alert("Product could not be loaded. Start the backend and refresh this page.");
          };
        }
        if (buyBtn) {
          buyBtn.href = "javascript:void(0);";
          buyBtn.onclick = function (e) {
            e.preventDefault();
            alert("Product could not be loaded. Start the backend and refresh this page.");
          };
        }
        if (imgEl) {
          imgEl.src = placeholderImage();
          imgEl.alt = "Product unavailable";
        }
      });
  }

  function initMyListings() {
    var grid = qs("#myListingsGrid");
    if (!grid || window.location.pathname.toLowerCase().indexOf("mylistings") === -1) return;

    var user = getCurrentUser();
    if (!user) return;

    function load() {
      api("/api/my-listings/" + user.id, { method: "GET" }).then(function (data) {
        var list = Array.isArray(data) ? data : [];
        if (!list.length) {
          grid.innerHTML = "<div class='card'><div class='card-body'><strong>No listings yet.</strong><div class='help'>Click Add New Product to create one.</div></div></div>";
          return;
        }

        grid.innerHTML = list.map(function (p) {
          var img = getProductImageUrl(p.imageUrl);
          return "" +
            "<article class='card'>" +
            "<img class='product-img' alt='" + escapeHtml(p.title || "Listing") + "' src='" + img + "' />" +
            "<div class='card-body'><div><strong>" + escapeHtml(p.title) + "</strong></div>" +
            "<div class='product-meta'><span class='price'>" + formatINR(p.price) + "</span><span class='badge'>" + escapeHtml(p.condition) + "</span></div>" +
            "<div class='btn-row' style='margin-top:12px;'>" +
            "<button class='btn btn-outline' data-edit-id='" + p.id + "'>Edit</button>" +
            "<button class='btn btn-danger' data-delete-id='" + p.id + "'>Delete</button>" +
            "</div></div></article>";
        }).join("");

        qsa("[data-delete-id]", grid).forEach(function (btn) {
          btn.addEventListener("click", function () {
            var id = btn.getAttribute("data-delete-id");
            if (!confirm("Delete this listing?")) return;
            api("/api/products/" + id, { method: "DELETE" }).then(load).catch(function (err) {
              alert(err.message);
            });
          });
        });

        qsa("[data-edit-id]", grid).forEach(function (btn) {
          btn.addEventListener("click", function () {
            var id = btn.getAttribute("data-edit-id");
            window.location.href = "addproduct.html?editId=" + id;
          });
        });
      }).catch(function () {
        grid.innerHTML = "<div class='card'><div class='card-body'><strong>No listings yet.</strong><div class='help'>Please try again after logging in.</div></div></div>";
      });
    }

    load();
  }

  function initAddProduct() {
    var form = qs("#addProductForm") || qs("main form");
    var title = qs("#title");
    var description = qs("#description");
    var price = qs("#price");
    var condition = qs("#condition");
    var image = qs("#image");
    if (!form || !title || !description || !price || !condition || !image) return;
    if (window.location.pathname.toLowerCase().indexOf("addproduct") === -1) return;

    var params = new URLSearchParams(window.location.search);
    var editId = params.get("editId");
    var currentImageUrl = "";
    var submitBtn = qs("button[type='submit']", form);
    var pageTitle = qs(".page-title");
    var pageSubtitle = qs(".page-subtitle");

    if (editId) {
      if (submitBtn) submitBtn.textContent = "Update Product";
      if (pageTitle) pageTitle.textContent = "Edit Product";
      if (pageSubtitle) pageSubtitle.textContent = "Update your listing details.";

      api("/api/products/" + encodeURIComponent(editId), { method: "GET" }).then(function (p) {
        title.value = p.title || "";
        description.value = p.description || "";
        price.value = Number(p.price || 0);
        condition.value = p.condition || "";
        currentImageUrl = p.imageUrl || "";
      }).catch(function (err) {
        setError(form, err.message);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      setError(form, "");

      var user = getCurrentUser();
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      if (!title.value.trim() || !description.value.trim() || !price.value || !condition.value) {
        setError(form, "Please fill in all required fields.");
        return;
      }

      var file = image.files[0] || null;
      var needsImage = !editId && !file;
      if (needsImage) {
        setError(form, "Please select an image.");
        return;
      }

      Promise.resolve(file ? fileToDataUrl(file) : (currentImageUrl || placeholderImage()))
        .then(function (imageUrl) {
          var payload = {
            sellerId: user.id,
            title: title.value.trim(),
            description: description.value.trim(),
            price: Number(price.value),
            condition: condition.value,
            imageUrl: imageUrl
          };

          var url = editId ? ("/api/products/" + encodeURIComponent(editId)) : "/api/products";
          var method = editId ? "PUT" : "POST";

          return api(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        })
        .then(function () {
          window.location.href = "mylistings.html";
        })
        .catch(function (err) {
          setError(form, err.message);
        });
    });
  }

  function initSettings() {
    if (window.location.pathname.toLowerCase().indexOf("settings") === -1) return;

    var user = getCurrentUser();
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    var profileForm = qs("#profileForm") || qsa("form")[0];
    var passwordForm = qs("#passwordForm") || qsa("form")[1];

    // Load current user data into form fields
    if (profileForm) {
      var nameField = qs("#profileName", profileForm);
      var emailField = qs("#profileEmail", profileForm);
      var phoneField = qs("#profilePhone", profileForm);
      
      if (nameField) nameField.value = user.name || "";
      if (emailField) emailField.value = user.email || "";
      if (phoneField) phoneField.value = user.phone || "";
    }

    // Always refresh from backend so after refresh you see the latest phone/name/email.
    api("/api/users/" + user.id, { method: "GET" }).then(function (fullUser) {
      if (!fullUser) return;
      user.name = fullUser.name || user.name;
      user.email = fullUser.email || user.email;
      user.phone = fullUser.phone || user.phone;
      setCurrentUser(user);

      if (profileForm) {
        var nameField2 = qs("#profileName", profileForm);
        var emailField2 = qs("#profileEmail", profileForm);
        var phoneField2 = qs("#profilePhone", profileForm);
        if (nameField2) nameField2.value = user.name || "";
        if (emailField2) emailField2.value = user.email || "";
        if (phoneField2) phoneField2.value = user.phone || "";
      }
    }).catch(function () {
      // Ignore; page still works using localStorage.
    });

    if (profileForm) {
      profileForm.addEventListener("submit", function (e) {
        e.preventDefault();
        setError(profileForm, "");

        var payload = {
          name: (qs("#profileName") || {}).value,
          email: (qs("#profileEmail") || {}).value,
          phone: (qs("#profilePhone") || {}).value
        };

        if (!payload.name || !payload.email || !payload.phone) {
          setError(profileForm, "Please fill in all profile fields.");
          return;
        }

        api("/api/users/" + user.id, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).then(function () {
          user.name = payload.name;
          user.email = payload.email;
          user.phone = payload.phone;
          setCurrentUser(user);
          updateCurrentUserPhone(payload.phone);
          setError(profileForm, "Profile updated successfully.");
        }).catch(function (err) {
          setError(profileForm, err.message);
        });
      });
    }

    if (passwordForm) {
      passwordForm.addEventListener("submit", function (e) {
        e.preventDefault();
        setError(passwordForm, "");

        var currentPassword = (qs("#currentPassword") || {}).value || "";
        var newPassword = (qs("#newPassword") || {}).value || "";
        var confirmPassword = (qs("#confirmPassword") || {}).value || "";

        if (!currentPassword || !newPassword || !confirmPassword) {
          setError(passwordForm, "Please fill Current, New, and Confirm password.");
          return;
        }
        if (newPassword !== confirmPassword) {
          setError(passwordForm, "New password and confirm password do not match.");
          return;
        }

        api("/api/users/" + user.id + "/password", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword,
            confirmPassword: confirmPassword
          })
        }).then(function () {
          setError(passwordForm, "Password updated successfully.");
          passwordForm.reset();
        }).catch(function (err) {
          setError(passwordForm, err.message);
        });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    attachPasswordToggles();
    attachDemoButtons();
    attachLogout();
    requireAuthForAppPages();
    initLogin();
    initRegister();
    initHome();
    initProduct();
    initMyListings();
    initAddProduct();
    initSettings();
  });
})();
