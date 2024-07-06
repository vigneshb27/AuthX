function updateOtp(secret) {
            
    var key = base32tohex(secret);
    var epoch = Math.round(new Date().getTime() / 1000.0);
    console.log(new Date().getTime());
    var time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, '0');
    var shaObj = new jsSHA("SHA-1", "HEX");
    shaObj.setHMACKey(key, "HEX");
    shaObj.update(time);
    var hmac = shaObj.getHMAC("HEX");
    var offset = hex2dec(hmac.substring(hmac.length - 1));
    var otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')) + '';
    otp = (otp).substr(otp.length - 6, 6);
    return otp;
}