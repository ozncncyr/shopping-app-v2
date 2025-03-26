let cart = JSON.parse(localStorage.getItem("cart")) || []; 
let products = JSON.parse(localStorage.getItem("products")) || []; 
let totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

const emailJSServiceID = 'service_rni45ss';
const emailJSTemplateID = 'template_85ntlxx';
const emailJSUserID = 'Y9wHu6O9WM4bnS2fy';

document.addEventListener('DOMContentLoaded', () => {
    updateProductList();
    updateCart();
});

// Ürünleri ekrana yazdırma
function updateProductList() {
    const productListDiv = document.getElementById('product-list');
    productListDiv.innerHTML = ""; 

    products.forEach(product => {
        if (product.quantity > 0) {
            const productDiv = document.createElement('div');
            productDiv.classList.add('product');
            
            productDiv.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>Fiyat: ${product.price} TL</p>
                <p>Adet: ${product.quantity}</p>
                <button class="add-to-cart" data-name="${product.name}" data-price="${product.price}" data-quantity="${product.quantity}">Sepete Ekle</button>
            `;
            
            productListDiv.appendChild(productDiv);
        }
    });

    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', addToCart);
    });
}

// Sepete ürün ekleme
function addToCart(event) {
    const productName = event.target.getAttribute('data-name');
    const productPrice = parseFloat(event.target.getAttribute('data-price'));
    const availableQuantity = parseInt(event.target.getAttribute('data-quantity'));
    
    const quantityToAdd = parseInt(prompt(`Kaç adet ${productName} eklemek istersiniz? (Maksimum: ${availableQuantity})`));

    if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
        iziToast.error({
            title: 'Hata',
            message: 'Geçerli bir miktar girin.',
        });
        return;
    }

    if (quantityToAdd > availableQuantity) {
        iziToast.error({
            title: 'Hata',
            message: 'Stoktan fazla ürün ekleyemezsiniz.',
        });
        return;
    }

    const cartItem = cart.find(item => item.name === productName);

    if (cartItem) {
        cartItem.quantity += quantityToAdd;
    } else {
        cart.push({ name: productName, price: productPrice, quantity: quantityToAdd });
    }

    totalPrice += productPrice * quantityToAdd;

    localStorage.setItem("cart", JSON.stringify(cart));

    const product = products.find(item => item.name === productName);
    product.quantity -= quantityToAdd;

    localStorage.setItem("products", JSON.stringify(products));

    updateProductList();
    updateCart();

    iziToast.success({
        title: 'Başarılı',
        message: `${quantityToAdd} adet ${productName} sepete eklendi.`,
    });
}

// Sepeti güncelleme
function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const totalElement = document.getElementById('total-price');
    
    cartItems.innerHTML = "";
    cart.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.name} - ${item.price} TL x ${item.quantity}`;

        const removeButton = document.createElement("button");
        removeButton.textContent = "Kaldır";
        removeButton.classList.add("remove-from-cart");
        removeButton.setAttribute("data-name", item.name);
        removeButton.addEventListener("click", removeFromCart);

        li.appendChild(removeButton);
        cartItems.appendChild(li);
    });

    totalElement.textContent = totalPrice;
}

// Sepetten ürün kaldırma
function removeFromCart(event) {
    const productName = event.target.getAttribute('data-name');

    cart = cart.filter(item => item.name !== productName);

    const product = products.find(item => item.name === productName);
    if (product) {
        const cartItem = cart.find(item => item.name === productName);
        if (cartItem) {
            product.quantity += cartItem.quantity;
        }
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("products", JSON.stringify(products));

    updateProductList();
    updateCart();

    iziToast.success({
        title: 'Başarılı',
        message: `${productName} sepetinizden kaldırıldı.`,
    });
}

// Siparişi tamamlama
document.getElementById('complete-order').addEventListener('click', function () {
    const email = prompt("Lütfen e-posta adresinizi girin:");

    if (email) {
        sendEmail(email); 
        cart.forEach(item => {
            const product = products.find(p => p.name === item.name);
            if (product && product.quantity <= 0) {
                const productIndex = products.indexOf(product);
                if (productIndex !== -1) {
                    products.splice(productIndex, 1); 
                }
            }
        });

        // Sepeti temizle
        cart = [];
        localStorage.removeItem("cart");
        totalPrice = 0;

        // Ürünleri localStorage'a kaydet
        localStorage.setItem("products", JSON.stringify(products));

        // Listeyi güncelle
        updateProductList();
        updateCart();

        iziToast.success({
            title: 'Başarılı',
            message: 'Siparişiniz başarıyla tamamlandı.',
        });
    } else {
        iziToast.error({
            title: 'Hata',
            message: 'E-posta adresi girmediniz.',
        });
    }
});

// E-posta gönderme işlevi
function sendEmail(email) {
    const orderDetails = cart.map(item => `${item.name} - ${item.quantity} x ${item.price} TL`).join("\n");
    const emailContent = `
        Sipariş Detayları:
        ${orderDetails}
        
        Toplam: ${totalPrice} TL
    `;
    
    emailjs.send(emailJSServiceID, emailJSTemplateID, {
        email: email,
        message: emailContent
    })
    .then((response) => {
        console.log("E-posta gönderildi: ", response);
        iziToast.success({
            title: 'Başarılı',
            message: 'Sipariş detaylarınız e-posta ile gönderildi.',
        });
    }, (error) => {
        console.error("E-posta gönderilemedi: ", error);
        iziToast.error({
            title: 'Hata',
            message: 'E-posta gönderilirken bir hata oluştu.',
        });
    });
}
