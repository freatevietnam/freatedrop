from django import forms


class DropForm(forms.Form):
    content = forms.CharField(required=True, widget=forms.Textarea)
    password = forms.CharField(required=False, widget=forms.PasswordInput(render_value=True))
