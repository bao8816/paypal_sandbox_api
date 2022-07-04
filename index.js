const express = require('express')
const paypal = require('paypal-rest-sdk')
const handlebars = require('express-handlebars')
var path = require('path')

require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000

// Configure the paypal environment
paypal.configure({
    'mode': 'sandbox', // Sandbox or live
    'client_id': process.env.CLIENT_ID,
    'client_secret': process.env.CLIENT_SECRET,
})

app.set('views', path.join(__dirname, 'views'))
app.engine('handlebars', handlebars.engine())
app.set('view engine', 'handlebars')

var items = [
    {
        name: 'Item 1',
        price: '1.00',
        currency: 'USD',
        quantity: 1
    },
    {
        name: 'Item 2',
        price: '2.00',
        currency: 'USD',
        quantity: 1
    }
]

var total = 0;
items.forEach(function(item) {
    total += item.price * item.quantity;
})

app.get('/', (req, res) => {
    res.render('index', {
        items: items,
    })
    }
)

//--------------------------PAYPAL------------------------


app.post('/pay', (req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": items
            },
            "amount": {
                "currency": "USD",
                "total": total.toString()
            },
            "description": "This is the payment description."
        }]
    }

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href)
                }
            }
            // console.log(payment);
        }
    });
})

app.get('/success', (req, res) => {
    const payerId = req.query.PayerID
    const paymentId = req.query.paymentId

    var execute_payment_json = {
        "payer_id": payerId,
        transactions: [{
            amount: {
                currency: 'USD',
                total: total
            }
        }]
    }

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            res.render('success')
        }
    });
})

app.get('/cancel', (req, res) => {
    res.render('cancel')
})

//---------------------------------------------------------------------



app.listen(3000, () => {
    console.log('Server started on port 3000')
}
)