namespace TP1___Programacion_III
{
    partial class Ejercicio1
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.lblEjercicio1 = new System.Windows.Forms.Label();
            this.txtEjercicio1 = new System.Windows.Forms.TextBox();
            this.btnEjercicio1 = new System.Windows.Forms.Button();
            this.listBox1 = new System.Windows.Forms.ListBox();
            this.listBox2 = new System.Windows.Forms.ListBox();
            this.button1 = new System.Windows.Forms.Button();
            this.BtnPasarTodo = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // lblEjercicio1
            // 
            this.lblEjercicio1.AutoSize = true;
            this.lblEjercicio1.BackColor = System.Drawing.Color.DimGray;
            this.lblEjercicio1.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblEjercicio1.ForeColor = System.Drawing.SystemColors.Window;
            this.lblEjercicio1.Location = new System.Drawing.Point(53, 81);
            this.lblEjercicio1.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.lblEjercicio1.Name = "lblEjercicio1";
            this.lblEjercicio1.Size = new System.Drawing.Size(204, 25);
            this.lblEjercicio1.TabIndex = 0;
            this.lblEjercicio1.Text = "Ingrese su nombre: ";
            // 
            // txtEjercicio1
            // 
            this.txtEjercicio1.BackColor = System.Drawing.SystemColors.ControlDarkDark;
            this.txtEjercicio1.Font = new System.Drawing.Font("Microsoft Sans Serif", 11.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.txtEjercicio1.ForeColor = System.Drawing.SystemColors.Window;
            this.txtEjercicio1.Location = new System.Drawing.Point(323, 79);
            this.txtEjercicio1.Margin = new System.Windows.Forms.Padding(4);
            this.txtEjercicio1.Name = "txtEjercicio1";
            this.txtEjercicio1.Size = new System.Drawing.Size(332, 29);
            this.txtEjercicio1.TabIndex = 1;
            // 
            // btnEjercicio1
            // 
            this.btnEjercicio1.BackColor = System.Drawing.Color.LimeGreen;
            this.btnEjercicio1.Font = new System.Drawing.Font("Microsoft Sans Serif", 11.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnEjercicio1.Location = new System.Drawing.Point(700, 75);
            this.btnEjercicio1.Margin = new System.Windows.Forms.Padding(4);
            this.btnEjercicio1.Name = "btnEjercicio1";
            this.btnEjercicio1.Size = new System.Drawing.Size(143, 37);
            this.btnEjercicio1.TabIndex = 2;
            this.btnEjercicio1.Text = "Agregar";
            this.btnEjercicio1.UseVisualStyleBackColor = false;
            this.btnEjercicio1.Click += new System.EventHandler(this.btnEjercicio1_Click);
            // 
            // listBox1
            // 
            this.listBox1.FormattingEnabled = true;
            this.listBox1.ItemHeight = 16;
            this.listBox1.Items.AddRange(new object[] {
            " "});
            this.listBox1.Location = new System.Drawing.Point(137, 149);
            this.listBox1.Margin = new System.Windows.Forms.Padding(4);
            this.listBox1.Name = "listBox1";
            this.listBox1.Size = new System.Drawing.Size(309, 340);
            this.listBox1.TabIndex = 3;
            // 
            // listBox2
            // 
            this.listBox2.FormattingEnabled = true;
            this.listBox2.ItemHeight = 16;
            this.listBox2.Location = new System.Drawing.Point(561, 149);
            this.listBox2.Margin = new System.Windows.Forms.Padding(4);
            this.listBox2.Name = "listBox2";
            this.listBox2.Size = new System.Drawing.Size(315, 340);
            this.listBox2.TabIndex = 4;
            this.listBox2.SelectedIndexChanged += new System.EventHandler(this.listBox2_SelectedIndexChanged);
            // 
            // button1
            // 
            this.button1.Location = new System.Drawing.Point(476, 257);
            this.button1.Margin = new System.Windows.Forms.Padding(4);
            this.button1.Name = "button1";
            this.button1.Size = new System.Drawing.Size(48, 48);
            this.button1.TabIndex = 5;
            this.button1.Text = ">";
            this.button1.UseVisualStyleBackColor = true;
            this.button1.Click += new System.EventHandler(this.button1_Click);
            // 
            // BtnPasarTodo
            // 
            this.BtnPasarTodo.Location = new System.Drawing.Point(476, 325);
            this.BtnPasarTodo.Name = "BtnPasarTodo";
            this.BtnPasarTodo.Size = new System.Drawing.Size(48, 48);
            this.BtnPasarTodo.TabIndex = 6;
            this.BtnPasarTodo.Text = ">>";
            this.BtnPasarTodo.UseVisualStyleBackColor = true;
            this.BtnPasarTodo.Click += new System.EventHandler(this.BtnPasarTodos_Click);
            // 
            // Ejercicio1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.AutoValidate = System.Windows.Forms.AutoValidate.EnableAllowFocusChange;
            this.BackColor = System.Drawing.Color.Black;
            this.ClientSize = new System.Drawing.Size(1067, 554);
            this.Controls.Add(this.BtnPasarTodo);
            this.Controls.Add(this.button1);
            this.Controls.Add(this.listBox2);
            this.Controls.Add(this.listBox1);
            this.Controls.Add(this.btnEjercicio1);
            this.Controls.Add(this.txtEjercicio1);
            this.Controls.Add(this.lblEjercicio1);
            this.Margin = new System.Windows.Forms.Padding(4);
            this.Name = "Ejercicio1";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Ejercicio 1";
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.Ejercicio1_FormClosed);
            this.Load += new System.EventHandler(this.Ejercicio1_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label lblEjercicio1;
        private System.Windows.Forms.TextBox txtEjercicio1;
        private System.Windows.Forms.Button btnEjercicio1;
        private System.Windows.Forms.ListBox listBox1;
        private System.Windows.Forms.ListBox listBox2;
        private System.Windows.Forms.Button button1;
        private System.Windows.Forms.Button BtnPasarTodo;
    }
}