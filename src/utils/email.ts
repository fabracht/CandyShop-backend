import nodemailer from "nodemailer";

export const sendEmail = async (options: any): Promise<any> => {
  // 1 CREATE A TRANSPORTER
  // const transporter = nodemailer.createTransport({
  //   host: "smtp.sendgrid.net",
  //   port: 587,
  //   secure: false,
  //   requireTLS: true,
  //   auth: {
  //     user: "apikey", // SendGrid user
  //     pass: process.env.SENDGRIDPASS, // SendGrid password
  //   },
  // });
  const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "4a9f71f9db7341",
      pass: "43d435e91bfd28",
    },
  });
  // 2 DEFINE THE EMAIL OPTIONS
  const emailOptions = {
    from: '"No Reply" <noreply@meninasdoceiras.com>', // PUT YOUR DOMAIN HERE
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: options.message, // plain text body
    // html
  };
  // const emailOptions = {
  //   from: '"No Reply" <noreply@meninasdoceiras.com>', // PUT YOUR DOMAIN HERE
  //   to: `"CustomerName" <fabracht@gmail.com>`, // list of receivers
  //   subject: "Your Order was Sent", // Subject line
  //   text: "This is a test email", // plain text body
  // };
  // 3 ACTUALLY SEND THE EMAIL
  try {
    const result = await transporter.sendMail(emailOptions);
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
    return undefined;
  }
};
