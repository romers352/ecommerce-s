import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { ordersAPI, settingsAPI } from '../utils/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { getImageUrl } from '../utils/helpers';

interface PaymentMethod {
  id: number;
  name: string;
  type: 'stripe' | 'paypal' | 'razorpay' | 'bank_transfer' | 'cash_on_delivery' | 'other';
  displayName: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
}

interface CheckoutForm {
  // Shipping Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Payment Information
  selectedPaymentMethod: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
  
  // Options
  saveInfo: boolean;
  sameAsBilling: boolean;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [orderComplete, setOrderComplete] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  
  const [formData, setFormData] = useState<CheckoutForm>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    selectedPaymentMethod: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    saveInfo: false,
    sameAsBilling: true,
  });

  const items = cart.items;
  const subtotal = totalPrice || 0;
  const shipping = 0; // Free shipping
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + shipping + tax;

  // Handle redirects in useEffect to avoid render-time navigation
  React.useEffect(() => {
    if (items.length === 0 && !orderComplete) {
      navigate('/cart');
    } else if (!isAuthenticated && !user) {
      navigate('/login');
    }
  }, [items.length, orderComplete, isAuthenticated, user, navigate]);

  // Fetch active payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingPaymentMethods(true);
        const response = await settingsAPI.getActivePaymentMethods();
        const methods = Array.isArray(response.data) ? response.data : [];
        setPaymentMethods(methods);
        
        // Set default payment method if available
        if (methods.length > 0 && !formData.selectedPaymentMethod) {
          setFormData(prev => ({
            ...prev,
            selectedPaymentMethod: methods[0].type
          }));
        }
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
        setError('Failed to load payment methods');
        setPaymentMethods([]); // Ensure it's always an array
      } finally {
        setLoadingPaymentMethods(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Show loading or return null while redirecting
  if ((items.length === 0 && !orderComplete) || (!isAuthenticated && !user)) {
    return null;
  }

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : '';
  };

  const formatExpiryDate = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (name === 'phone') {
      formattedValue = value.replace(/\D/g, '');
    }

    // Clear error for this field when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : formattedValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all steps before submitting
    const step1Validation = validateStep(1);
    const step2Validation = validateStep(2);
    
    if (!step1Validation.isValid || !step2Validation.isValid) {
      const errors: Record<string, boolean> = {};
      [...step1Validation.invalidFields, ...step2Validation.invalidFields].forEach(field => {
        errors[field] = true;
      });
      setFieldErrors(errors);
      return;
    }
    
    setLoading(true);
    
    try {
        const orderData = {
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            company: '',
            address1: formData.address,
            address2: '',
            city: formData.city,
            state: formData.state,
            postalCode: formData.zipCode,
            country: formData.country,
            phone: formData.phone,
          },
          billingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            company: '',
            address1: formData.address,
            address2: '',
            city: formData.city,
            state: formData.state,
            postalCode: formData.zipCode,
            country: formData.country,
            phone: formData.phone,
          },
          paymentMethod: formData.selectedPaymentMethod,
          notes: formData.selectedPaymentMethod === 'stripe' || formData.selectedPaymentMethod === 'razorpay' 
            ? `Payment via ${formData.cardName} ending in ${formData.cardNumber.slice(-4)}`
            : `Payment method: ${paymentMethods.find(pm => pm.type === formData.selectedPaymentMethod)?.displayName || formData.selectedPaymentMethod}`,
        };
        
        console.log('Creating order...');
        await ordersAPI.create(orderData);
      
      clearCart();
      setOrderComplete(true);
    } catch (error: any) {
        console.error('Order creation failed:', error);
        setError('Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.length >= 13 && cleaned.length <= 19 && /^\d+$/.test(cleaned);
  };

  const validateExpiryDate = (expiryDate: string): boolean => {
    const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!regex.test(expiryDate)) return false;
    
    const [month, year] = expiryDate.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year);
    const expMonth = parseInt(month);
    
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return false;
    }
    
    return true;
  };

  const validateCVV = (cvv: string): boolean => {
    return /^\d{3,4}$/.test(cvv);
  };

  const validateStep = (step: number): { isValid: boolean; invalidFields: string[] } => {
    const invalidFields: string[] = [];
    
    switch (step) {
      case 1:
        if (!formData.firstName.trim()) invalidFields.push('firstName');
        if (!formData.lastName.trim()) invalidFields.push('lastName');
        if (!formData.email.trim() || !validateEmail(formData.email)) invalidFields.push('email');
        if (!formData.phone.trim()) invalidFields.push('phone');
        if (!formData.address.trim()) invalidFields.push('address');
        if (!formData.city.trim()) invalidFields.push('city');
        if (!formData.state.trim()) invalidFields.push('state');
        if (!formData.zipCode.trim()) invalidFields.push('zipCode');
        if (!formData.country.trim()) invalidFields.push('country');
        break;
      case 2:
        // Always require payment method selection
        if (!formData.selectedPaymentMethod.trim()) invalidFields.push('selectedPaymentMethod');
        
        // Only validate card fields for card-based payment methods
        if (formData.selectedPaymentMethod === 'stripe' || formData.selectedPaymentMethod === 'razorpay') {
          if (!formData.cardNumber.trim() || !validateCardNumber(formData.cardNumber)) invalidFields.push('cardNumber');
          if (!formData.expiryDate.trim() || !validateExpiryDate(formData.expiryDate)) invalidFields.push('expiryDate');
          if (!formData.cvv.trim() || !validateCVV(formData.cvv)) invalidFields.push('cvv');
          if (!formData.cardName.trim()) invalidFields.push('cardName');
        }
        break;
    }
    
    return { isValid: invalidFields.length === 0, invalidFields };
  };

  const nextStep = () => {
    const validation = validateStep(currentStep);
    if (!validation.isValid) {
      const errors: Record<string, boolean> = {};
      validation.invalidFields.forEach(field => {
        errors[field] = true;
      });
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setError(''); // Clear any previous errors
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setError(''); // Clear any previous errors
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-8 text-center"
          >
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
            <p className="text-gray-600 mb-8">
              Thank you for your purchase. Your order has been successfully placed and will be processed shortly.
            </p>
            <div className="space-y-4">
              <Button onClick={() => navigate('/orders')} className="w-full sm:w-auto transition-all duration-200 ease-out transform hover:scale-105">
                View Orders
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/products')}
                className="w-full sm:w-auto ml-0 sm:ml-4 transition-all duration-200 ease-out transform hover:scale-105"
              >
                Continue Shopping
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-600 hidden sm:inline">
                  {step === 1 && 'Shipping'}
                  {step === 2 && 'Payment'}
                  {step === 3 && 'Review'}
                </span>
                {step < 3 && (
                  <div
                    className={`w-4 sm:w-16 h-1 ml-2 sm:ml-4 ${
                      step < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* Main Content */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Shipping Information */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      id="checkout-firstName"
                      label="First Name *"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      hasError={fieldErrors.firstName}
                    />
                    <Input
                      id="checkout-lastName"
                      label="Last Name *"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      hasError={fieldErrors.lastName}
                    />
                    <Input
                      id="checkout-email"
                      label="Email *"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="sm:col-span-2"
                      hasError={fieldErrors.email}
                    />
                    <Input
                      id="checkout-phone"
                      label="Phone *"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="sm:col-span-2"
                      hasError={fieldErrors.phone}
                    />
                    <Input
                      id="checkout-address"
                      label="Address *"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="sm:col-span-2"
                      hasError={fieldErrors.address}
                    />
                    <Input
                      id="checkout-city"
                      label="City *"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      hasError={fieldErrors.city}
                    />
                    <Input
                      id="checkout-state"
                      label="State *"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      hasError={fieldErrors.state}
                    />
                    <Input
                      id="checkout-zipCode"
                      label="ZIP Code *"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      required
                      hasError={fieldErrors.zipCode}
                    />
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                        fieldErrors.country ? 'text-red-700' : 'text-gray-700'
                      }`}>
                        Country *
                      </label>
                      <select
                        id="checkout-country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-all duration-200 ${
                           fieldErrors.country 
                             ? 'border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50' 
                             : 'border-gray-300 focus:ring-primary-500 focus:border-transparent bg-white'
                         }`}
                        required
                      >
                        <option value="">Select a country</option>
                        <option value="Afghanistan">Afghanistan</option>
                        <option value="Albania">Albania</option>
                        <option value="Algeria">Algeria</option>
                        <option value="Andorra">Andorra</option>
                        <option value="Angola">Angola</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Armenia">Armenia</option>
                        <option value="Australia">Australia</option>
                        <option value="Austria">Austria</option>
                        <option value="Azerbaijan">Azerbaijan</option>
                        <option value="Bahamas">Bahamas</option>
                        <option value="Bahrain">Bahrain</option>
                        <option value="Bangladesh">Bangladesh</option>
                        <option value="Barbados">Barbados</option>
                        <option value="Belarus">Belarus</option>
                        <option value="Belgium">Belgium</option>
                        <option value="Belize">Belize</option>
                        <option value="Benin">Benin</option>
                        <option value="Bhutan">Bhutan</option>
                        <option value="Bolivia">Bolivia</option>
                        <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                        <option value="Botswana">Botswana</option>
                        <option value="Brazil">Brazil</option>
                        <option value="Brunei">Brunei</option>
                        <option value="Bulgaria">Bulgaria</option>
                        <option value="Burkina Faso">Burkina Faso</option>
                        <option value="Burundi">Burundi</option>
                        <option value="Cambodia">Cambodia</option>
                        <option value="Cameroon">Cameroon</option>
                        <option value="Canada">Canada</option>
                        <option value="Cape Verde">Cape Verde</option>
                        <option value="Central African Republic">Central African Republic</option>
                        <option value="Chad">Chad</option>
                        <option value="Chile">Chile</option>
                        <option value="China">China</option>
                        <option value="Colombia">Colombia</option>
                        <option value="Comoros">Comoros</option>
                        <option value="Congo">Congo</option>
                        <option value="Costa Rica">Costa Rica</option>
                        <option value="Croatia">Croatia</option>
                        <option value="Cuba">Cuba</option>
                        <option value="Cyprus">Cyprus</option>
                        <option value="Czech Republic">Czech Republic</option>
                        <option value="Denmark">Denmark</option>
                        <option value="Djibouti">Djibouti</option>
                        <option value="Dominica">Dominica</option>
                        <option value="Dominican Republic">Dominican Republic</option>
                        <option value="Ecuador">Ecuador</option>
                        <option value="Egypt">Egypt</option>
                        <option value="El Salvador">El Salvador</option>
                        <option value="Equatorial Guinea">Equatorial Guinea</option>
                        <option value="Eritrea">Eritrea</option>
                        <option value="Estonia">Estonia</option>
                        <option value="Ethiopia">Ethiopia</option>
                        <option value="Fiji">Fiji</option>
                        <option value="Finland">Finland</option>
                        <option value="France">France</option>
                        <option value="Gabon">Gabon</option>
                        <option value="Gambia">Gambia</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Germany">Germany</option>
                        <option value="Ghana">Ghana</option>
                        <option value="Greece">Greece</option>
                        <option value="Grenada">Grenada</option>
                        <option value="Guatemala">Guatemala</option>
                        <option value="Guinea">Guinea</option>
                        <option value="Guinea-Bissau">Guinea-Bissau</option>
                        <option value="Guyana">Guyana</option>
                        <option value="Haiti">Haiti</option>
                        <option value="Honduras">Honduras</option>
                        <option value="Hungary">Hungary</option>
                        <option value="Iceland">Iceland</option>
                        <option value="India">India</option>
                        <option value="Indonesia">Indonesia</option>
                        <option value="Iran">Iran</option>
                        <option value="Iraq">Iraq</option>
                        <option value="Ireland">Ireland</option>
                        <option value="Israel">Israel</option>
                        <option value="Italy">Italy</option>
                        <option value="Jamaica">Jamaica</option>
                        <option value="Japan">Japan</option>
                        <option value="Jordan">Jordan</option>
                        <option value="Kazakhstan">Kazakhstan</option>
                        <option value="Kenya">Kenya</option>
                        <option value="Kiribati">Kiribati</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Kyrgyzstan">Kyrgyzstan</option>
                        <option value="Laos">Laos</option>
                        <option value="Latvia">Latvia</option>
                        <option value="Lebanon">Lebanon</option>
                        <option value="Lesotho">Lesotho</option>
                        <option value="Liberia">Liberia</option>
                        <option value="Libya">Libya</option>
                        <option value="Liechtenstein">Liechtenstein</option>
                        <option value="Lithuania">Lithuania</option>
                        <option value="Luxembourg">Luxembourg</option>
                        <option value="Madagascar">Madagascar</option>
                        <option value="Malawi">Malawi</option>
                        <option value="Malaysia">Malaysia</option>
                        <option value="Maldives">Maldives</option>
                        <option value="Mali">Mali</option>
                        <option value="Malta">Malta</option>
                        <option value="Marshall Islands">Marshall Islands</option>
                        <option value="Mauritania">Mauritania</option>
                        <option value="Mauritius">Mauritius</option>
                        <option value="Mexico">Mexico</option>
                        <option value="Micronesia">Micronesia</option>
                        <option value="Moldova">Moldova</option>
                        <option value="Monaco">Monaco</option>
                        <option value="Mongolia">Mongolia</option>
                        <option value="Montenegro">Montenegro</option>
                        <option value="Morocco">Morocco</option>
                        <option value="Mozambique">Mozambique</option>
                        <option value="Myanmar">Myanmar</option>
                        <option value="Namibia">Namibia</option>
                        <option value="Nauru">Nauru</option>
                        <option value="Nepal">Nepal</option>
                        <option value="Netherlands">Netherlands</option>
                        <option value="New Zealand">New Zealand</option>
                        <option value="Nicaragua">Nicaragua</option>
                        <option value="Niger">Niger</option>
                        <option value="Nigeria">Nigeria</option>
                        <option value="North Korea">North Korea</option>
                        <option value="North Macedonia">North Macedonia</option>
                        <option value="Norway">Norway</option>
                        <option value="Oman">Oman</option>
                        <option value="Pakistan">Pakistan</option>
                        <option value="Palau">Palau</option>
                        <option value="Panama">Panama</option>
                        <option value="Papua New Guinea">Papua New Guinea</option>
                        <option value="Paraguay">Paraguay</option>
                        <option value="Peru">Peru</option>
                        <option value="Philippines">Philippines</option>
                        <option value="Poland">Poland</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Romania">Romania</option>
                        <option value="Russia">Russia</option>
                        <option value="Rwanda">Rwanda</option>
                        <option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
                        <option value="Saint Lucia">Saint Lucia</option>
                        <option value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
                        <option value="Samoa">Samoa</option>
                        <option value="San Marino">San Marino</option>
                        <option value="Sao Tome and Principe">Sao Tome and Principe</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="Senegal">Senegal</option>
                        <option value="Serbia">Serbia</option>
                        <option value="Seychelles">Seychelles</option>
                        <option value="Sierra Leone">Sierra Leone</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Slovakia">Slovakia</option>
                        <option value="Slovenia">Slovenia</option>
                        <option value="Solomon Islands">Solomon Islands</option>
                        <option value="Somalia">Somalia</option>
                        <option value="South Africa">South Africa</option>
                        <option value="South Korea">South Korea</option>
                        <option value="South Sudan">South Sudan</option>
                        <option value="Spain">Spain</option>
                        <option value="Sri Lanka">Sri Lanka</option>
                        <option value="Sudan">Sudan</option>
                        <option value="Suriname">Suriname</option>
                        <option value="Sweden">Sweden</option>
                        <option value="Switzerland">Switzerland</option>
                        <option value="Syria">Syria</option>
                        <option value="Taiwan">Taiwan</option>
                        <option value="Tajikistan">Tajikistan</option>
                        <option value="Tanzania">Tanzania</option>
                        <option value="Thailand">Thailand</option>
                        <option value="Timor-Leste">Timor-Leste</option>
                        <option value="Togo">Togo</option>
                        <option value="Tonga">Tonga</option>
                        <option value="Trinidad and Tobago">Trinidad and Tobago</option>
                        <option value="Tunisia">Tunisia</option>
                        <option value="Turkey">Turkey</option>
                        <option value="Turkmenistan">Turkmenistan</option>
                        <option value="Tuvalu">Tuvalu</option>
                        <option value="Uganda">Uganda</option>
                        <option value="Ukraine">Ukraine</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="Uruguay">Uruguay</option>
                        <option value="Uzbekistan">Uzbekistan</option>
                        <option value="Vanuatu">Vanuatu</option>
                        <option value="Vatican City">Vatican City</option>
                        <option value="Venezuela">Venezuela</option>
                        <option value="Vietnam">Vietnam</option>
                        <option value="Yemen">Yemen</option>
                        <option value="Zambia">Zambia</option>
                        <option value="Zimbabwe">Zimbabwe</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <Button onClick={nextStep} type="button" className="w-full sm:w-auto transition-all duration-200 ease-out transform hover:scale-105">
                      Continue to Payment
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment Information */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
                  
                  <div className="space-y-6">
                    {/* Payment Method Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Payment Method *
                      </label>
                      {loadingPaymentMethods ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        </div>
                      ) : paymentMethods.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No payment methods available
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {paymentMethods.map((method) => {
                            const getPaymentIcon = (type: string) => {
                              switch (type) {
                                case 'stripe':
                                case 'razorpay':
                                  return <CreditCardIcon className="h-5 w-5" />;
                                case 'paypal':
                                  return <BuildingLibraryIcon className="h-5 w-5" />;
                                case 'bank_transfer':
                                  return <BuildingLibraryIcon className="h-5 w-5" />;
                                case 'cash_on_delivery':
                                  return <BanknotesIcon className="h-5 w-5" />;
                                default:
                                  return <CreditCardIcon className="h-5 w-5" />;
                              }
                            };
                            
                            return (
                              <label
                                key={method.id}
                                className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                                  formData.selectedPaymentMethod === method.type
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="selectedPaymentMethod"
                                  value={method.type}
                                  checked={formData.selectedPaymentMethod === method.type}
                                  onChange={handleInputChange}
                                  className="sr-only"
                                />
                                <div className="flex items-center space-x-3">
                                  <div className={`text-gray-600 ${
                                    formData.selectedPaymentMethod === method.type ? 'text-indigo-600' : ''
                                  }`}>
                                    {getPaymentIcon(method.type)}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {method.displayName}
                                    </div>
                                    {method.description && (
                                      <div className="text-sm text-gray-500">
                                        {method.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {formData.selectedPaymentMethod === method.type && (
                                  <div className="absolute top-2 right-2">
                                    <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
                                  </div>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Card Details - Only show for card-based payment methods */}
                    {(formData.selectedPaymentMethod === 'stripe' || formData.selectedPaymentMethod === 'razorpay') && (
                      <div className="space-y-6 pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Card Details</h3>
                        
                        <Input
                          id="checkout-cardNumber"
                          label="Card Number *"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234 5678 9012 3456"
                          required
                          leftIcon={<CreditCardIcon className="h-5 w-5 text-gray-400" />}
                          hasError={fieldErrors.cardNumber}
                        />
                        
                        <div className="grid grid-cols-2 gap-6">
                          <Input
                            id="checkout-expiryDate"
                            label="Expiry Date *"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                            placeholder="MM/YY"
                            required
                            hasError={fieldErrors.expiryDate}
                          />
                          <Input
                            id="checkout-cvv"
                            label="CVV *"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            placeholder="123"
                            required
                            hasError={fieldErrors.cvv}
                          />
                        </div>
                        
                        <Input
                          id="checkout-cardName"
                          label="Name on Card *"
                          name="cardName"
                          value={formData.cardName}
                          onChange={handleInputChange}
                          required
                          hasError={fieldErrors.cardName}
                        />
                      </div>
                    )}
                    
                    {/* Payment Method Instructions */}
                    {formData.selectedPaymentMethod === 'paypal' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          You will be redirected to PayPal to complete your payment securely.
                        </p>
                      </div>
                    )}
                    
                    {formData.selectedPaymentMethod === 'bank_transfer' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          Bank transfer details will be provided after order confirmation. Please allow 2-3 business days for processing.
                        </p>
                      </div>
                    )}
                    
                    {formData.selectedPaymentMethod === 'cash_on_delivery' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800">
                          Pay with cash when your order is delivered. Additional delivery charges may apply.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
                    <Button variant="secondary" onClick={prevStep} type="button" className="w-full sm:w-auto transition-all duration-200 ease-out transform hover:scale-105">
                      Back
                    </Button>
                    <Button 
                      onClick={nextStep} 
                      type="button"
                      disabled={!formData.selectedPaymentMethod || loadingPaymentMethods}
                      className="w-full sm:w-auto transition-all duration-200 ease-out transform hover:scale-105 disabled:hover:scale-100"
                    >
                      Review Order
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Order Review */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Order</h2>
                  
                  {/* Order Items */}
                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 sm:p-4 border border-gray-200 rounded-lg">
                        <img
                          src={getImageUrl(item.product.images?.[0])}
                          alt={item.product.name}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{item.product.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-gray-900 text-sm sm:text-base">
                            ${(Number(item.product.price || 0) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Shipping & Payment Info */}
                  <div className="grid grid-cols-1 gap-6 mb-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                      <div className="text-sm text-gray-600">
                        <p>{formData.firstName} {formData.lastName}</p>
                        <p>{formData.address}</p>
                        <p>{formData.city}, {formData.state} {formData.zipCode}</p>
                        <p>{formData.country}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Payment Method</h3>
                      <div className="text-sm text-gray-600">
                        <p>**** **** **** {formData.cardNumber.slice(-4)}</p>
                        <p>{formData.cardName}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <Button variant="secondary" onClick={prevStep} type="button" className="w-full sm:w-auto transition-all duration-200 ease-out transform hover:scale-105">
                      Back
                    </Button>
                    <Button type="submit" loading={loading} className="w-full sm:w-auto transition-all duration-200 ease-out transform hover:scale-105 disabled:hover:scale-100">
                      Place Order
                    </Button>
                  </div>
                </motion.div>
              )}
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 order-1 lg:order-2 mb-8 lg:mb-0 lg:mt-0">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:sticky lg:top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 flex-shrink-0">
                      ${(Number(item.product.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Totals */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Security Features */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span>Secure SSL encryption</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <TruckIcon className="h-4 w-4" />
                  <span>Free shipping on all orders</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;